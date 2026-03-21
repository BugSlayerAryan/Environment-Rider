// api.js - OPTIMIZED
// 🌍 ENTERPRISE ENVIRONMENT DATA SERVICE
// Active APIs only: Weather, AQI, UV, Pollen, NASA NDVI

// ===============================
// 🌐 CONFIG
// ===============================
const CONFIG = {
  BASE_URLS: {
    weather: "https://api.openweathermap.org/data/2.5",
    aqi: "https://api.waqi.info/feed",
    ambee: "https://api.ambeedata.com",
    nasaModis: "https://modis.ornl.gov/rst/api/v1",
  },

  TIMEOUT: 3000, // 3 sec (reduced for faster failure recovery)
  TIMEOUT_SECONDARY: 2000, // 2 sec for non-critical data
  RETRIES: 0, // No retries - fail fast and use fallback
};

// ===============================
// 🔑 ENV KEYS (SECURE)
// ===============================
const API_KEYS = {
  weather: import.meta.env.VITE_WEATHER_KEY,
  aqi: import.meta.env.VITE_WAQI_KEY,
  ambee: import.meta.env.VITE_AMBEE_KEY,
};

// ===============================
// ⚙️ GENERIC FETCH CLIENT
// ===============================
const fetchWithTimeout = async (url, options = {}) => {
  const timeout = options.timeout || CONFIG.TIMEOUT;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      const httpError = new Error(`HTTP Error: ${response.status}`);
      httpError.status = response.status;
      throw httpError;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// ===============================
// 🔁 RETRY WRAPPER WITH EXPONENTIAL BACKOFF
// ===============================
const fetchWithRetry = async (fn, retries = CONFIG.RETRIES, delayMs = 300) => {
  try {
    return await fn();
  } catch (error) {
    const status = Number(error?.status);
    // Do not retry client/auth errors (e.g. 401/403/404).
    if (Number.isFinite(status) && status >= 400 && status < 500) {
      throw error;
    }

    // DO retry server errors (5xx) and network errors
    if (retries <= 0) throw error;
    
    console.warn(`⏳ API error, retry in ${delayMs}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Exponential backoff: 300ms -> 600ms
    return fetchWithRetry(fn, retries - 1, delayMs * 2);
  }
};

// ===============================
// 📦 SAFE PARSER
// ===============================
const safe = (value, fallback = null) =>
  value !== undefined && value !== null ? value : fallback;

const locationRequestCache = new Map();

const normalizeCoord = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Number(numeric.toFixed(6));
};

const withLocationCache = async (
  namespace,
  lat,
  lon,
  fetcher,
  options = {}
) => {
  const { force = false, ttlMs = 120000 } = options;
  const normalizedLat = normalizeCoord(lat);
  const normalizedLon = normalizeCoord(lon);

  if (!Number.isFinite(normalizedLat) || !Number.isFinite(normalizedLon)) {
    return fetcher();
  }

  const key = `${namespace}:${normalizedLat},${normalizedLon}`;
  const now = Date.now();
  const existing = locationRequestCache.get(key);

  if (!force && existing?.data !== undefined && now - existing.timestamp <= ttlMs) {
    return existing.data;
  }

  if (!force && existing?.inflight) {
    return existing.inflight;
  }

  const inflight = (async () => {
    const data = await fetcher();
    locationRequestCache.set(key, {
      data,
      timestamp: Date.now(),
      inflight: null,
    });
    return data;
  })();

  locationRequestCache.set(key, {
    data: existing?.data,
    timestamp: existing?.timestamp || 0,
    inflight,
  });

  try {
    return await inflight;
  } catch (error) {
    const latest = locationRequestCache.get(key);
    if (latest?.inflight) {
      locationRequestCache.set(key, {
        data: existing?.data,
        timestamp: existing?.timestamp || 0,
        inflight: null,
      });
    }
    throw error;
  }
};

// ===============================
// 🌤 WEATHER SERVICE
// ===============================
export const WeatherAPI = {
  get: (lat, lon, options = {}) =>
    withLocationCache(
      'weather',
      lat,
      lon,
      () => fetchWithRetry(async () => {
        const data = await fetchWithTimeout(
          `${CONFIG.BASE_URLS.weather}/weather?lat=${lat}&lon=${lon}&appid=${API_KEYS.weather}&units=metric`
        );

        return {
          temp: safe(data?.main?.temp, 0),
          humidity: safe(data?.main?.humidity, 0),
          wind: safe(data?.wind?.speed, 0),
          windDeg: safe(data?.wind?.deg, 0),
          condition: safe(data?.weather?.[0]?.main, "N/A"),
        };
      }),
      {
        force: Boolean(options?.force),
        ttlMs: Number(options?.ttlMs) || 60000,
      }
    ),
};

// ===============================
// 🌫 AQI SERVICE
// ===============================
export const AQIAPI = {
  get: (lat, lon, options = {}) =>
    withLocationCache(
      'aqi',
      lat,
      lon,
      () => fetchWithRetry(async () => {
        const url = `${CONFIG.BASE_URLS.aqi}/geo:${lat};${lon}/?token=${API_KEYS.aqi}`;
        const data = await fetchWithTimeout(url);

        return {
          aqi: safe(data?.data?.aqi, 0),
          pm25: safe(data?.data?.iaqi?.pm25?.v, 0),
          pm10: safe(data?.data?.iaqi?.pm10?.v, 0),
        };
      }),
      {
        force: Boolean(options?.force),
        ttlMs: Number(options?.ttlMs) || 90000,
      }
    ),
};

// ===============================
// ☀️ UV & DAYLIGHT SERVICE
// ===============================
export const UVAPI = {
  get: (lat, lon, options = {}) =>
    withLocationCache(
      'uv',
      lat,
      lon,
      () => fetchWithRetry(async () => {
        const uvUrl = `${CONFIG.BASE_URLS.weather}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEYS.weather}`;
        const weatherUrl = `${CONFIG.BASE_URLS.weather}/weather?lat=${lat}&lon=${lon}&appid=${API_KEYS.weather}&units=metric`;
        
        const [uvData, weatherData] = await Promise.all([
          fetchWithTimeout(uvUrl),
          fetchWithTimeout(weatherUrl),
        ]);

        const uvIndex = safe(uvData?.value, 0);
        const sunrise = safe(weatherData?.sys?.sunrise, 0);
        const sunset = safe(weatherData?.sys?.sunset, 0);
        const sunlightSeconds = sunset - sunrise;
        const sunlightHours = Math.round((sunlightSeconds / 3600) * 10) / 10;
        const radiationValue = Math.round(uvIndex * 20);

        return {
          uvi: Math.round(uvIndex * 10) / 10,
          sunlightHours: sunlightHours || 10,
          radiationValue: radiationValue || 165,
        };
      }),
      {
        force: Boolean(options?.force),
        ttlMs: Number(options?.ttlMs) || 90000,
      }
    ),
};

// ===============================
// 💧 WATER QUALITY SERVICE
// ===============================
export const WaterAPI = {
  get: (lat, lon, options = {}) =>
    withLocationCache(
      'water',
      lat,
      lon,
      () => fetchWithRetry(async () => {
      const response = await fetchWithTimeout(`/api/water?lat=${lat}&lng=${lon}`);

      const payload = response?.data ?? response;
      const pickRecord = (candidate) => {
        if (!candidate) return null;
        if (Array.isArray(candidate)) return candidate[0] || null;
        if (Array.isArray(candidate?.stations)) return candidate.stations[0] || null;
        if (Array.isArray(candidate?.data)) return candidate.data[0] || null;
        if (candidate?.data && typeof candidate.data === 'object') return candidate.data;
        return candidate;
      };

      const toNumber = (...candidates) => {
        for (const candidate of candidates) {
          const numeric = Number(candidate);
          if (Number.isFinite(numeric)) return numeric;
        }
        return null;
      };

      const toText = (...candidates) => {
        for (const candidate of candidates) {
          if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
          }
        }
        return null;
      };

      const normalizePollution = (value) => {
        if (!value) return null;
        const normalized = String(value).toLowerCase();
        if (normalized.includes('high') || normalized.includes('severe')) return 'high';
        if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate';
        if (normalized.includes('low') || normalized.includes('good') || normalized.includes('safe')) return 'low';
        return null;
      };

      const normalizeTurbidity = (value) => {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
          if (numeric <= 5) return 'Clear';
          if (numeric <= 25) return 'Slightly Cloudy';
          return 'Turbid';
        }

        const text = toText(value);
        if (!text) return 'Unknown';
        const normalized = text.toLowerCase();
        if (normalized.includes('clear')) return 'Clear';
        if (normalized.includes('cloud') || normalized.includes('haze')) return 'Slightly Cloudy';
        if (normalized.includes('turbid') || normalized.includes('muddy')) return 'Turbid';
        return text;
      };

      const record = pickRecord(payload);
      if (!record) {
        throw new Error('Water API returned no usable record');
      }

      const quality = record?.quality;
      const metrics = record?.metrics;

      const ph = toNumber(
        record?.ph,
        record?.pH,
        record?.phValue,
        quality?.ph,
        metrics?.ph
      );

      const dissolvedOxygen = toNumber(
        record?.dissolvedOxygen,
        record?.dissolved_oxygen,
        record?.do,
        quality?.dissolved_oxygen,
        quality?.do,
        metrics?.dissolvedOxygen,
        metrics?.do
      );

      const temperature = toNumber(
        record?.temperature,
        record?.temp,
        record?.waterTemperature,
        metrics?.temperature
      );

      const turbidity = normalizeTurbidity(
        record?.turbidity,
        record?.turbidity_status,
        record?.clarity,
        metrics?.turbidity
      );

      const pollutionFromApi = normalizePollution(
        toText(
          record?.pollutionLevel,
          record?.pollution_level,
          record?.pollution,
          quality?.status,
          quality?.pollution,
          metrics?.pollution
        )
      );

      const pollutionLevel = pollutionFromApi || (() => {
        if ((dissolvedOxygen !== null && dissolvedOxygen < 5) || (ph !== null && (ph < 6.5 || ph > 8.5))) {
          return 'high';
        }
        if ((dissolvedOxygen !== null && dissolvedOxygen < 7) || (ph !== null && (ph < 6.8 || ph > 8.2))) {
          return 'moderate';
        }
        return 'low';
      })();

      if (ph === null && dissolvedOxygen === null && temperature === null) {
        throw new Error('Water API did not return measurable pH, dissolved oxygen, or temperature');
      }

      return {
        ph,
        dissolvedOxygen,
        pollutionLevel,
        temperature,
        turbidity,
        siteName: toText(record?.siteName, record?.station_name, record?.station, record?.name),
        timestamp: record?.timestamp || record?.updatedAt || response?.timestamp || null,
        source: response?.source || 'Ambee Water Quality API',
      };
    }),
      {
        force: Boolean(options?.force),
        ttlMs: Number(options?.ttlMs) || 180000,
      }
    ),
};

// ===============================
// 🌿 POLLEN SERVICE
// ===============================
const getLatestNasaNdvi = async (lat, lon) => {
  const datesUrl = `${CONFIG.BASE_URLS.nasaModis}/MOD13Q1/dates?latitude=${lat}&longitude=${lon}`;
  const datesPayload = await fetchWithTimeout(datesUrl, { timeout: CONFIG.TIMEOUT_SECONDARY });
  const latest = datesPayload?.dates?.[datesPayload?.dates?.length - 1];
  const latestModisDate = latest?.modis_date;

  if (!latestModisDate) {
    throw new Error('NASA NDVI date not available for this location');
  }

  const subsetParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    band: '250m_16_days_NDVI',
    startDate: latestModisDate,
    endDate: latestModisDate,
    kmAboveBelow: '0',
    kmLeftRight: '0',
  });

  const subsetUrl = `${CONFIG.BASE_URLS.nasaModis}/MOD13Q1/subset?${subsetParams.toString()}`;
  const subsetPayload = await fetchWithTimeout(subsetUrl, { timeout: CONFIG.TIMEOUT_SECONDARY });

  const rawValue = Number(subsetPayload?.subset?.[0]?.data?.[0]);
  const scaleFactor = Number(subsetPayload?.scale || 0.0001);
  if (!Number.isFinite(rawValue) || rawValue === -3000) {
    throw new Error('NASA NDVI value unavailable for latest date');
  }

  const ndvi = rawValue * scaleFactor;
  const vegetationIndex = Math.max(0, Math.min(100, Math.round(((ndvi + 1) / 2) * 100)));
  const health = ndvi >= 0.6 ? 'Excellent' : ndvi >= 0.4 ? 'Healthy' : ndvi >= 0.2 ? 'Moderate' : 'Low';

  return {
    ndvi: Math.round(ndvi * 1000) / 1000,
    vegetationIndex,
    health,
    calendarDate: safe(subsetPayload?.subset?.[0]?.calendar_date, null),
    source: 'NASA MODIS NDVI',
  };
};

export const PollenAPI = {
  get: (lat, lon, options = {}) =>
    withLocationCache(
      'pollen',
      lat,
      lon,
      () => fetchWithRetry(async () => {
      const url = `/api/pollen?lat=${lat}&lng=${lon}`;
      
      // PRIORITY FETCH: Get pollen data FIRST with standard timeout
      let response = null;
      let pollenUnavailable = false;
      
      try {
        response = await fetchWithTimeout(url);
      } catch {
        pollenUnavailable = true;
        console.warn('⚠️ Pollen data unavailable, will try vegetation data');
      }

      // BACKGROUND FETCH: Get NDVI data with SHORT timeout (don't block pollen display)
      let ndviData = null;
      try {
        // Use 3-second timeout for NDVI - we have Ambee fallback
        ndviData = await Promise.race([
          getLatestNasaNdvi(lat, lon),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('NDVI timeout')), 3000)
          )
        ]).catch(() => null); // Silently fail, fallback to Ambee vegetation
      } catch {
        ndviData = null; // NDVI optional - use Ambee data instead
      }

      if (pollenUnavailable && !ndviData) {
        return {
          pollenCount: null,
          grass: null,
          tree: null,
          weed: null,
          riskLevel: 'Low',
          vegetationIndex: null,
          ndvi: null,
          vegetationHealth: null,
          pollenUnavailable: true,
          vegetationUnavailable: true,
          timestamp: safe(response?.timestamp, null),
          source: safe(response?.source, 'Ambee Pollen API'),
          vegetationSource: null,
          unavailable: true,
          details: safe(response?.details, 'Pollen data unavailable'),
        };
      }

      const pickFirstRecord = (payload) => {
        if (!payload) return null;
        if (Array.isArray(payload)) return payload[0] || null;
        if (Array.isArray(payload?.data)) return payload.data[0] || null;
        if (payload?.data && typeof payload.data === 'object') return payload.data;
        return payload;
      };

      const parseMetric = (...candidates) => {
        for (const candidate of candidates) {
          const numeric = Number(candidate);
          if (Number.isFinite(numeric)) return numeric;
        }
        return null;
      };

      const parseText = (...candidates) => {
        for (const candidate of candidates) {
          if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
        }
        return null;
      };

      const normalizeVegetationIndex = (rawValue) => {
        const numeric = Number(rawValue);
        if (!Number.isFinite(numeric)) return null;
        if (numeric >= 0 && numeric <= 1) return Math.round(numeric * 100);
        if (numeric >= -1 && numeric < 0) return 0;
        if (numeric > 1) return Math.max(0, Math.min(100, Math.round(numeric)));
        return null;
      };

      const apiPayload = response?.data;
      const record = pickFirstRecord(apiPayload);
      const count = record?.Count || record?.count || {};
      const indexes = record?.Indexes || record?.indexes || {};
      const risk = record?.Risk || record?.risk || {};

      const grass = parseMetric(record?.Grass, record?.grass, count?.grass_pollen);
      const tree = parseMetric(record?.Tree, record?.tree, count?.tree_pollen);
      const weed = parseMetric(record?.Weed, record?.weed, count?.weed_pollen);

      const hasAnyPollenMetric = [grass, tree, weed].some((value) => value !== null);
      const componentTotal = hasAnyPollenMetric
        ? [grass, tree, weed].reduce((sum, value) => sum + (value || 0), 0)
        : null;
      const total = parseMetric(record?.pollenCount, record?.totalPollen, componentTotal);

      if (!record || !hasAnyPollenMetric || total === null) {
        throw new Error('Pollen API returned no usable pollen metrics');
      }

      const derivedRiskLevel = Number.isFinite(total)
        ? (total > 150 ? 'High' : total > 80 ? 'Moderate' : 'Low')
        : 'Low';
      const apiRiskLevel = parseText(record?.riskLevel, risk?.overall);
      const normalizedRiskLevel = (() => {
        if (!apiRiskLevel) return derivedRiskLevel;
        const normalized = apiRiskLevel.toLowerCase();
        if (normalized.includes('high')) return 'High';
        if (normalized.includes('moderate') || normalized.includes('medium')) return 'Moderate';
        if (normalized.includes('low')) return 'Low';
        return derivedRiskLevel;
      })();

      const ambeeVegetation = normalizeVegetationIndex(
        parseMetric(record?.vegetationIndex, record?.ndvi, indexes?.ndvi)
      );
      const vegetationIndex = ndviData?.vegetationIndex ?? ambeeVegetation;

      return {
        pollenCount: Number.isFinite(total) ? total : null,
        grass,
        tree,
        weed,
        riskLevel: normalizedRiskLevel,
        vegetationIndex,
        ndvi: safe(ndviData?.ndvi, null),
        vegetationHealth: safe(ndviData?.health, null),
        pollenUnavailable: false,
        vegetationUnavailable: ndviData === null && ambeeVegetation === null,
        timestamp: safe(response?.timestamp, null),
        source: safe(response?.source, null),
        vegetationSource: safe(ndviData?.source, null),
        unavailable: pollenUnavailable && vegetationIndex === null,
        details: pollenUnavailable ? safe(response?.details, null) : null,
      };
    }),
      {
        force: Boolean(options?.force),
        ttlMs: Number(options?.ttlMs) || 180000,
      }
    ),
};

// ===============================
// 🌱 SOIL SERVICE (OPENWEATHER + ISRIC)
// ===============================
const getLayerMeanValue = (soilPayload, layerName) => {
  const layers = soilPayload?.properties?.layers;
  if (!Array.isArray(layers)) return null;

  const targetLayer = layers.find((layer) => layer?.name === layerName);
  const mean = targetLayer?.depths?.[0]?.values?.mean;
  const numeric = Number(mean);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizePh = (rawPh) => {
  const numeric = Number(rawPh);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric > 14 ? numeric / 10 : numeric;
};

const classifySocLevel = (rawSoc) => {
  const numeric = Number(rawSoc);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  if (numeric >= 20) return 'High';
  if (numeric >= 10) return 'Medium';
  return 'Poor';
};

export const SoilAPI = {
  get: (lat, lon, options = {}) =>
    withLocationCache(
      'soil',
      lat,
      lon,
      () => fetchWithRetry(async () => {
      const [moistureResult, temperatureResult, soilResult] = await Promise.allSettled([
        fetchWithTimeout(`/api/soil/moisture?lat=${lat}&lng=${lon}`),
        fetchWithTimeout(`/api/soil/temperature?lat=${lat}&lng=${lon}`),
        fetchWithTimeout(`/api/soil?lat=${lat}&lng=${lon}`),
      ]);

      const moistureResponse = moistureResult.status === 'fulfilled' ? moistureResult.value : null;
      const temperatureResponse = temperatureResult.status === 'fulfilled' ? temperatureResult.value : null;
      const soilResponse = soilResult.status === 'fulfilled' ? soilResult.value : null;
      const soilAvailability =
        soilResult.status !== 'fulfilled' || soilResponse?.unavailable
          ? 'unavailable'
          : 'live';

      const phMean = getLayerMeanValue(soilResponse?.data, 'phh2o');
      const socMean = getLayerMeanValue(soilResponse?.data, 'soc');
      const bdodMean = getLayerMeanValue(soilResponse?.data, 'bdod');

      const moistureSeries = moistureResponse?.data?.properties?.parameter?.GWETTOP;
      let nasaMoisture = null;
      if (moistureSeries && typeof moistureSeries === 'object') {
        const dateKeys = Object.keys(moistureSeries).sort((a, b) => b.localeCompare(a));
        for (const key of dateKeys) {
          const candidate = Number(moistureSeries[key]);
          if (Number.isFinite(candidate) && candidate >= 0) {
            nasaMoisture = Math.max(0, Math.min(100, Math.round(candidate * 100)));
            break;
          }
        }
      }

      let openMeteoMoisture = null;
      const currentMoistureRaw = Number(temperatureResponse?.data?.current?.soil_moisture_0_to_1cm);
      if (Number.isFinite(currentMoistureRaw) && currentMoistureRaw >= 0) {
        openMeteoMoisture = Math.max(0, Math.min(100, Math.round(currentMoistureRaw * 100)));
      }

      if (openMeteoMoisture === null) {
        const hourlyMoisture = temperatureResponse?.data?.hourly?.soil_moisture_0_to_1cm;
        if (Array.isArray(hourlyMoisture)) {
          for (let i = hourlyMoisture.length - 1; i >= 0; i -= 1) {
            const candidate = Number(hourlyMoisture[i]);
            if (Number.isFinite(candidate) && candidate >= 0) {
              openMeteoMoisture = Math.max(0, Math.min(100, Math.round(candidate * 100)));
              break;
            }
          }
        }
      }

      const moisture = nasaMoisture ?? openMeteoMoisture;

      const temperatureRaw = Number(temperatureResponse?.data?.current?.soil_temperature_0cm);
      const temperature = Number.isFinite(temperatureRaw)
        ? Math.round(temperatureRaw * 10) / 10
        : null;

      const ph = normalizePh(phMean);

      if (ph === null && moisture === null && temperature === null) {
        throw new Error('No usable live soil metrics were returned by NASA SMAP, Open-Meteo, and ISRIC');
      }

      return {
        ph,
        soc: classifySocLevel(socMean),
        bdod: bdodMean,
        temperature,
        moisture,
        soilAvailability,
        sources: {
          moisture: nasaMoisture !== null
            ? (moistureResult.status === 'fulfilled'
              ? safe(moistureResponse?.source, 'NASA POWER GWETTOP')
              : 'NASA POWER GWETTOP')
            : 'Open-Meteo (fallback)',
          temperature: temperatureResult.status === 'fulfilled'
            ? safe(temperatureResponse?.source, 'Open-Meteo')
            : 'Open-Meteo',
          soil: soilResult.status === 'fulfilled'
            ? safe(soilResponse?.source, 'ISRIC SoilGrids API')
            : null,
        },
      };
    }),
      {
        force: Boolean(options?.force),
        ttlMs: Number(options?.ttlMs) || 180000,
      }
    ),
};

// ===============================
// 🌎 ECOSYSTEM SERVICE (NASA + GBIF)
// ===============================
export const EcosystemAPI = {
  get: (lat, lon) =>
    fetchWithRetry(async () => {
      const response = await fetchWithTimeout(`/api/ecosystem?lat=${lat}&lng=${lon}`);

      const vegetationIndexRaw = Number(response?.data?.vegetationIndex);
      const biodiversityRaw = Number(response?.data?.biodiversityScore);
      const forestRaw = Number(response?.data?.forestCoverage);

      return {
        vegetationIndex: Number.isFinite(vegetationIndexRaw)
          ? Math.max(0, Math.min(1, vegetationIndexRaw))
          : null,
        ndvi: Number.isFinite(Number(response?.data?.ndvi)) ? Number(response.data.ndvi) : null,
        biodiversityScore: Number.isFinite(biodiversityRaw)
          ? Math.max(0, Math.min(100, Math.round(biodiversityRaw)))
          : null,
        biodiversityCount: Number.isFinite(Number(response?.data?.biodiversityCount))
          ? Number(response.data.biodiversityCount)
          : null,
        forestCoverage: Number.isFinite(forestRaw)
          ? Math.max(0, Math.min(100, Math.round(forestRaw)))
          : null,
        timestamp: safe(response?.data?.timestamp, null),
        source: {
          ndvi: safe(response?.source?.ndvi, null),
          biodiversity: safe(response?.source?.biodiversity, null),
          forestCoverage: safe(response?.source?.forestCoverage, null),
        },
        unavailable: {
          ndvi: safe(response?.unavailable?.ndvi, false),
          biodiversity: safe(response?.unavailable?.biodiversity, false),
          forestCoverage: safe(response?.unavailable?.forestCoverage, false),
        },
        details: safe(response?.details, null),
      };
    }),
};
