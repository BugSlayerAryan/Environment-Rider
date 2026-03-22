/* global process */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const AMBEE_API_KEY = process.env.VITE_AMBEE_KEY?.trim();
const AMBEE_BASE_URL = 'https://api.ambeedata.com';
const NASA_MODIS_BASE_URL = 'https://modis.ornl.gov/rst/api/v1';
const SOIL_BASE_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
const NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GBIF_BASE_URL = 'https://api.gbif.org/v1';

// Log startup info
console.log('🔑 API Key Status:', AMBEE_API_KEY ? '✅ Loaded' : '❌ Missing - check .env file');
console.log('📍 Ambee Base URL:', AMBEE_BASE_URL);

// Utility: Fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeoutMs = 9000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// 💧 Water Quality Proxy
app.get('/api/water', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    if (!AMBEE_API_KEY) {
      console.error('❌ Missing API key for water endpoint');
      return res.status(500).json({ error: 'Missing Ambee API key' });
    }

    console.log('🌐 Proxying water quality request:', { lat, lng });

    const response = await fetch(
      `${AMBEE_BASE_URL}/water/latest/by-lat-lng?lat=${lat}&lng=${lng}`,
      {
        headers: {
          'x-api-key': AMBEE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📡 Ambee response status:', response.status);

    if (!response.ok) {
      const upstreamErrorText = await response.text();
      const isAuthError = response.status === 401 || response.status === 403;

      if (isAuthError) {
        return res.status(response.status).json({
          error: 'Ambee authentication failed for water API',
          status: response.status,
          details: upstreamErrorText || 'Check AMBEE API key validity and water endpoint entitlement.',
        });
      }

      return res.status(response.status).json({
        error: 'Ambee water API request failed',
        status: response.status,
        details: upstreamErrorText || null,
      });
    }

    const data = await response.json();
    console.log('✅ Water quality data received');
    
    res.json({
      data: data,
      source: 'Ambee Water Quality API',
    });
  } catch (error) {
    console.error('❌ Water quality proxy error:', error.message);
    res.status(502).json({ error: 'Water quality proxy error', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server running', 
    timestamp: new Date().toISOString(),
    apiKeySet: !!AMBEE_API_KEY,
  });
});

// 🌿 Pollen Proxy
app.get('/api/pollen', async (req, res) => {
  try {
    const { lat } = req.query;
    const lng = req.query.lng ?? req.query.lon;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    if (!AMBEE_API_KEY) {
      console.error('❌ Missing API key for pollen endpoint');
      return res.status(500).json({ error: 'Missing Ambee API key' });
    }

    console.log('🌐 Proxying pollen data request:', { lat, lng });

    const response = await fetch(
      `${AMBEE_BASE_URL}/latest/pollen/by-lat-lng?lat=${lat}&lng=${lng}`,
      {
        headers: {
          'x-api-key': AMBEE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📡 Ambee pollen response status:', response.status);

    if (!response.ok) {
      const upstreamErrorText = await response.text();
      // Return a soft-unavailable payload for known quota/rate/coverage scenarios.
      if (response.status === 422 || response.status === 429) {
        console.warn(`⚠️ Pollen upstream unavailable (status ${response.status}); serving soft-unavailable payload.`);
        return res.json({
          data: null,
          source: 'Ambee Pollen API',
          unavailable: true,
          status: response.status,
          details: upstreamErrorText || null,
        });
      }

      return res.status(response.status).json({
        error: 'Ambee pollen API request failed',
        status: response.status,
        details: upstreamErrorText || null,
      });
    }

    const data = await response.json();
    console.log('✅ Pollen data received');
    
    res.json({
      data: data,
      source: 'Ambee Pollen API',
    });
  } catch (error) {
    console.error('❌ Pollen proxy error:', error.message);
    res.status(502).json({ error: 'Pollen proxy error', details: error.message });
  }
});

// 🌱 Soil Proxy
app.get('/api/soil', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const params = new URLSearchParams();
    params.append('lat', String(lat));
    params.append('lon', String(lng));
    params.append('property', 'phh2o');
    params.append('property', 'soc');
    params.append('property', 'bdod');
    params.append('depth', '0-5cm');
    params.append('value', 'mean');

    const url = `${SOIL_BASE_URL}?${params.toString()}`;
    console.log('🌐 Proxying soil request:', { lat, lng });

    const response = await fetch(url);
    console.log('📡 SoilGrids response status:', response.status);

    if (!response.ok) {
      const upstreamErrorText = await response.text();
      if (response.status >= 500) {
        return res.json({
          data: null,
          source: 'ISRIC SoilGrids API',
          unavailable: true,
          status: response.status,
          details: upstreamErrorText || null,
        });
      }

      return res.status(response.status).json({
        error: 'SoilGrids API request failed',
        status: response.status,
        details: upstreamErrorText || null,
      });
    }

    const data = await response.json();
    res.json({
      data,
      source: 'ISRIC SoilGrids API',
    });
  } catch (error) {
    console.error('❌ Soil proxy error:', error.message);
    return res.status(502).json({ error: 'Soil proxy error', details: error.message });
  }
});

// 🌱 Soil Moisture Proxy (NASA POWER GWETTOP)
app.get('/api/soil/moisture', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const formatPowerDate = (date) => {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const params = new URLSearchParams({
      parameters: 'GWETTOP',
      community: 'AG',
      longitude: String(lng),
      latitude: String(lat),
      start: formatPowerDate(yesterday),
      end: formatPowerDate(today),
      format: 'JSON',
    });

    const url = `${NASA_POWER_BASE_URL}?${params.toString()}`;
    console.log('🌐 Proxying NASA soil moisture request:', { lat, lng });

    const response = await fetch(url);
    console.log('📡 NASA POWER response status:', response.status);

    if (!response.ok) {
      const upstreamErrorText = await response.text();
      return res.json({
        data: null,
        source: 'NASA POWER GWETTOP',
        unavailable: true,
        status: response.status,
        details: upstreamErrorText || null,
      });
    }

    const data = await response.json();
    return res.json({
      data,
      source: 'NASA POWER GWETTOP',
      unavailable: false,
    });
  } catch (error) {
    console.error('❌ NASA soil moisture proxy error:', error.message);
    return res.json({
      data: null,
      source: 'NASA POWER GWETTOP',
      unavailable: true,
      details: error.message,
    });
  }
});

// 🌡 Soil Temperature Proxy (Open-Meteo)
app.get('/api/soil/temperature', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: 'soil_temperature_0cm,soil_moisture_0_to_1cm',
      hourly: 'soil_moisture_0_to_1cm',
      forecast_days: '1',
      timezone: 'auto',
    });

    const url = `${OPEN_METEO_BASE_URL}?${params.toString()}`;
    console.log('🌐 Proxying Open-Meteo soil temperature request:', { lat, lng });

    const response = await fetch(url);
    console.log('📡 Open-Meteo response status:', response.status);

    if (!response.ok) {
      const upstreamErrorText = await response.text();
      return res.json({
        data: null,
        source: 'Open-Meteo',
        unavailable: true,
        status: response.status,
        details: upstreamErrorText || null,
      });
    }

    const data = await response.json();
    return res.json({
      data,
      source: 'Open-Meteo',
      unavailable: false,
    });
  } catch (error) {
    console.error('❌ Open-Meteo soil temperature proxy error:', error.message);
    return res.json({
      data: null,
      source: 'Open-Meteo',
      unavailable: true,
      details: error.message,
    });
  }
});

const fetchNasaNdvi = async (lat, lng) => {
  try {
    const datesUrl = `${NASA_MODIS_BASE_URL}/MOD13Q1/dates?latitude=${lat}&longitude=${lng}`;
    const datesResponse = await fetchWithTimeout(datesUrl, {}, 5000);
    if (!datesResponse.ok) {
      throw new Error(`NASA MODIS dates request failed (${datesResponse.status})`);
    }

    const datesPayload = await datesResponse.json();
    const latest = datesPayload?.dates?.[datesPayload?.dates?.length - 1];
    const latestModisDate = latest?.modis_date;
    if (!latestModisDate) {
      throw new Error('NASA MODIS NDVI date unavailable for this location');
    }

    const subsetParams = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      band: '250m_16_days_NDVI',
      startDate: latestModisDate,
      endDate: latestModisDate,
      kmAboveBelow: '0',
      kmLeftRight: '0',
    });

    const subsetUrl = `${NASA_MODIS_BASE_URL}/MOD13Q1/subset?${subsetParams.toString()}`;
    const subsetResponse = await fetchWithTimeout(subsetUrl, {}, 5000);
    if (!subsetResponse.ok) {
      throw new Error(`NASA MODIS subset request failed (${subsetResponse.status})`);
    }

    const subsetPayload = await subsetResponse.json();
    const rawValue = Number(subsetPayload?.subset?.[0]?.data?.[0]);
    const scaleFactor = Number(subsetPayload?.scale || 0.0001);
    if (!Number.isFinite(rawValue) || rawValue === -3000) {
      throw new Error('NASA MODIS NDVI value unavailable');
    }

    const ndvi = rawValue * scaleFactor;
    const normalized = Math.max(0, Math.min(1, (ndvi + 1) / 2));

    return {
      ndvi: Math.round(ndvi * 1000) / 1000,
      vegetationIndex: Math.round(normalized * 1000) / 1000,
      timestamp: subsetPayload?.subset?.[0]?.calendar_date || null,
      source: 'NASA EarthData MODIS NDVI',
    };
  } catch (error) {
    console.error('❌ NASA NDVI fetch error:', error.message);
    throw error;
  }
};

const buildGbifGeometryWkt = (lat, lng, deltaDegrees) => {
  const minLat = Number(lat) - deltaDegrees;
  const maxLat = Number(lat) + deltaDegrees;
  const minLng = Number(lng) - deltaDegrees;
  const maxLng = Number(lng) + deltaDegrees;

  return `POLYGON((${minLng} ${minLat},${maxLng} ${minLat},${maxLng} ${maxLat},${minLng} ${maxLat},${minLng} ${minLat}))`;
};

const fetchGbifSample = async ({ lat, lng, deltaDegrees, kingdomKey = null, limit = 300 }) => {
  const params = new URLSearchParams({
    geometry: buildGbifGeometryWkt(lat, lng, deltaDegrees),
    hasCoordinate: 'true',
    limit: String(limit),
  });

  if (kingdomKey) {
    params.set('kingdomKey', String(kingdomKey));
  }

  const url = `${GBIF_BASE_URL}/occurrence/search?${params.toString()}`;
  const response = await fetchWithTimeout(url, {}, 5000);
  if (!response.ok) {
    throw new Error(`GBIF occurrence request failed (${response.status})`);
  }

  const payload = await response.json();
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return {
    results,
    sampledCount: results.length,
    totalCount: Number.isFinite(Number(payload?.count)) ? Number(payload.count) : null,
  };
};

const fetchGbifBiodiversity = async (lat, lng) => {
  const deltas = [0.05, 0.1, 0.2, 0.4];
  let bestSample = null;
  let usedDelta = deltas[0];

  for (const delta of deltas) {
    const sample = await fetchGbifSample({ lat, lng, deltaDegrees: delta });
    if (sample.sampledCount > 0) {
      bestSample = sample;
      usedDelta = delta;
      if (sample.sampledCount >= 100) break;
    }
  }

  if (!bestSample) {
    throw new Error('GBIF biodiversity records unavailable');
  }

  const uniqueSpecies = new Set(
    bestSample.results
      .map((item) => item?.speciesKey || item?.taxonKey || null)
      .filter(Boolean)
  ).size;

  const richnessScore = Math.max(0, Math.min(100, Math.round((uniqueSpecies / Math.max(1, bestSample.sampledCount)) * 140)));
  const densityScore = Math.max(0, Math.min(100, Math.round(Math.log10((bestSample.totalCount || bestSample.sampledCount) + 1) * 12)));
  const biodiversityIndex = Math.round((richnessScore * 0.65) + (densityScore * 0.35));

  return {
    biodiversityScore: biodiversityIndex,
    occurrenceCount: bestSample.totalCount ?? bestSample.sampledCount,
    sampledCount: bestSample.sampledCount,
    uniqueSpeciesCount: uniqueSpecies,
    deltaDegrees: usedDelta,
    source: 'GBIF Occurrence API',
  };
};

const fetchGbifForestCoverage = async (lat, lng) => {
  const deltas = [0.05, 0.1, 0.2, 0.4];
  let baseSample = null;
  let usedDelta = deltas[0];

  for (const delta of deltas) {
    const sample = await fetchGbifSample({ lat, lng, deltaDegrees: delta });
    if (sample.sampledCount > 0) {
      baseSample = sample;
      usedDelta = delta;
      if (sample.sampledCount >= 120) break;
    }
  }

  if (!baseSample) {
    throw new Error('GBIF total occurrence records unavailable for forest proxy');
  }

  let plantSample = baseSample.results.filter((item) => String(item?.kingdom || '').toLowerCase() === 'plantae').length;

  if (plantSample === 0) {
    const dedicatedPlantSample = await fetchGbifSample({ lat, lng, deltaDegrees: usedDelta, kingdomKey: 6 });
    plantSample = dedicatedPlantSample.sampledCount;
  }

  const totalSample = Math.max(1, baseSample.sampledCount);
  let forestCoverage = Math.max(0, Math.min(100, Math.round((plantSample / totalSample) * 100)));

  if (forestCoverage === 0 && (baseSample.totalCount || 0) > 0) {
    forestCoverage = Math.max(5, Math.min(45, Math.round(Math.log10((baseSample.totalCount || 1) + 1) * 8)));
  }

  return {
    forestCoverage,
    plantOccurrenceCount: plantSample,
    totalOccurrenceCount: baseSample.totalCount ?? baseSample.sampledCount,
    sampledCount: baseSample.sampledCount,
    deltaDegrees: usedDelta,
    source: 'GBIF Occurrence API (Plantae density proxy)',
  };
};

// 🌎 Ecosystem Proxy (NASA NDVI + GBIF)
app.get('/api/ecosystem', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    console.log('🌐 Proxying ecosystem request:', { lat, lng });

    const [ndviResult, biodiversityResult, forestResult] = await Promise.allSettled([
      Promise.race([
        fetchNasaNdvi(lat, lng),
        new Promise((_, reject) => setTimeout(() => reject(new Error('NASA NDVI timeout')), 12000))
      ]),
      Promise.race([
        fetchGbifBiodiversity(lat, lng),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GBIF Biodiversity timeout')), 12000))
      ]),
      Promise.race([
        fetchGbifForestCoverage(lat, lng),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GBIF Forest timeout')), 12000))
      ]),
    ]);

    const ndviData = ndviResult.status === 'fulfilled' ? ndviResult.value : null;
    const biodiversityData = biodiversityResult.status === 'fulfilled' ? biodiversityResult.value : null;
    const forestData = forestResult.status === 'fulfilled' ? forestResult.value : null;

    const hasAnyData = ndviData || biodiversityData || forestData;
    if (!hasAnyData) {
      console.error('❌ No ecosystem data available:', {
        ndvi: ndviResult.status === 'rejected' ? ndviResult.reason?.message : 'no data',
        biodiversity: biodiversityResult.status === 'rejected' ? biodiversityResult.reason?.message : 'no data',
        forestCoverage: forestResult.status === 'rejected' ? forestResult.reason?.message : 'no data',
      });
      return res.status(502).json({
        error: 'Failed to fetch ecosystem metrics',
        details: {
          ndvi: ndviResult.status === 'rejected' ? ndviResult.reason?.message : null,
          biodiversity: biodiversityResult.status === 'rejected' ? biodiversityResult.reason?.message : null,
          forestCoverage: forestResult.status === 'rejected' ? forestResult.reason?.message : null,
        },
      });
    }

    return res.json({
      data: {
        vegetationIndex: ndviData?.vegetationIndex ?? null,
        ndvi: ndviData?.ndvi ?? null,
        biodiversityScore: biodiversityData?.biodiversityScore ?? null,
        biodiversityCount: biodiversityData?.occurrenceCount ?? null,
        forestCoverage: forestData?.forestCoverage ?? null,
        forestPlantCount: forestData?.plantOccurrenceCount ?? null,
        forestTotalCount: forestData?.totalOccurrenceCount ?? null,
        timestamp: ndviData?.timestamp || new Date().toISOString(),
      },
      source: {
        ndvi: ndviData?.source || null,
        biodiversity: biodiversityData?.source || null,
        forestCoverage: forestData?.source || null,
      },
      unavailable: {
        ndvi: !ndviData,
        biodiversity: !biodiversityData,
        forestCoverage: !forestData,
      },
      details: {
        ndvi: ndviResult.status === 'rejected' ? ndviResult.reason?.message : null,
        biodiversity: biodiversityResult.status === 'rejected' ? biodiversityResult.reason?.message : null,
        forestCoverage: forestResult.status === 'rejected' ? forestResult.reason?.message : null,
      },
    });
  } catch (error) {
    console.error('❌ Ecosystem proxy error:', error.message);
    return res.status(502).json({ error: 'Ecosystem proxy error', details: error.message });
  }
});

// Serve static files from dist folder (built frontend)
app.use(express.static('dist'));

const PORT = process.env.VITE_PROXY_PORT || 3001;
const HOST = process.env.VITE_PROXY_HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Proxy server running on http://${HOST}:${PORT}`);
  console.log(`   Water API: http://${HOST}:${PORT}/api/water?lat=28.6139&lng=77.2090`);
  console.log(`   Health: http://${HOST}:${PORT}/health`);
});
