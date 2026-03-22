import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { AQIAPI, PollenAPI, SoilAPI, UVAPI, WaterAPI, WeatherAPI } from '../api';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const scoreFromRange = (value, minIdeal, maxIdeal, tolerance = 0) => {
  if (!Number.isFinite(value)) return null;
  const lower = minIdeal - tolerance;
  const upper = maxIdeal + tolerance;

  if (value >= minIdeal && value <= maxIdeal) return 100;
  if (value < lower || value > upper) return 20;

  if (value < minIdeal) {
    const span = minIdeal - lower || 1;
    return Math.round(20 + ((value - lower) / span) * 80);
  }

  const span = upper - maxIdeal || 1;
  return Math.round(20 + ((upper - value) / span) * 80);
};

const toStatus = (score) => {
  if (score >= 75) {
    return {
      label: 'Excellent',
      message: 'Ecosystem is stable with healthy environmental indicators.',
      color: 'text-emerald-600 dark:text-emerald-300',
    };
  }

  if (score >= 50) {
    return {
      label: 'Fair',
      message: 'Mixed conditions detected. Monitoring and preventive actions are recommended.',
      color: 'text-amber-600 dark:text-amber-300',
    };
  }

  return {
    label: 'Critical',
    message: 'Immediate restoration action is urgently needed.',
    color: 'text-rose-600 dark:text-rose-300',
  };
};

const MODULE_LABELS = {
  weather: 'Weather',
  aqi: 'Air Quality',
  uv: 'UV',
  pollen: 'Pollen',
  soil: 'Soil',
  water: 'Water',
};

const FIELD_LABELS = {
  weather: {
    temp: 'Weather: Temperature',
    humidity: 'Weather: Humidity',
    wind: 'Weather: Wind',
  },
  aqi: {
    aqi: 'Air Quality: AQI',
  },
  uv: {
    uvi: 'UV: UVI',
  },
  pollen: {
    riskLevel: 'Pollen: Risk Level',
  },
  soil: {
    ph: 'Soil: pH',
    moisture: 'Soil: Moisture',
    temperature: 'Soil: Temperature',
  },
  water: {
    pollutionLevel: 'Water: Pollution Level',
    ph: 'Water: pH',
    dissolvedOxygen: 'Water: Dissolved Oxygen',
  },
};

const EcosystemHealthCalculate = ({ location = null, isDarkMode = false, onHealthCalculated = () => {} }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const onHealthCalculatedRef = useRef(onHealthCalculated);
  const [result, setResult] = useState({
    score: 0,
    status: toStatus(0),
    moduleScores: {},
    unavailableModules: [],
    excludedData: [],
  });

  useEffect(() => {
    onHealthCalculatedRef.current = onHealthCalculated;
  }, [onHealthCalculated]);

  useEffect(() => {
    const lat = Number(location?.lat);
    const lon = Number(location?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setError('Location is unavailable.');
      setLoading(false);
      onHealthCalculatedRef.current({
        score: 0,
        status: 'Unavailable',
        moduleScores: {},
        unavailableModules: ['weather', 'aqi', 'uv', 'pollen', 'soil', 'water'],
        excludedData: [
          'Weather',
          'Air Quality',
          'UV',
          'Pollen',
          'Soil',
          'Water',
        ],
        hasLiveData: false,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use a bounded timeout so slow providers can still contribute to the score.
        // Show results as they come in, but don't wait forever
        const fetchWithFastTimeout = (promise, timeoutMs = 5000) => 
          Promise.race([
            promise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeoutMs)
            )
          ]).catch(() => null);

        const [weatherRes, aqiRes, uvRes, pollenRes, soilRes, waterRes] = await Promise.allSettled([
          fetchWithFastTimeout(WeatherAPI.get(lat, lon), 9000),
          fetchWithFastTimeout(AQIAPI.get(lat, lon), 9000),
          fetchWithFastTimeout(UVAPI.get(lat, lon), 9000),
          fetchWithFastTimeout(PollenAPI.get(lat, lon), 9000),
          fetchWithFastTimeout(SoilAPI.get(lat, lon), 9000),
          fetchWithFastTimeout(WaterAPI.get(lat, lon), 9000),
        ]);

        if (cancelled) return;

        const weather = weatherRes.status === 'fulfilled' ? weatherRes.value : null;
        const aqi = aqiRes.status === 'fulfilled' ? aqiRes.value : null;
        const uv = uvRes.status === 'fulfilled' ? uvRes.value : null;
        const pollen = pollenRes.status === 'fulfilled' ? pollenRes.value : null;
        const soil = soilRes.status === 'fulfilled' ? soilRes.value : null;
        const water = waterRes.status === 'fulfilled' ? waterRes.value : null;

        const excludedData = [];

        const weatherMetricMap = {
          temp: scoreFromRange(Number(weather?.temp), 18, 30, 12),
          humidity: scoreFromRange(Number(weather?.humidity), 35, 70, 25),
          wind: scoreFromRange(Number(weather?.wind), 0, 10, 8),
        };
        const weatherSubscores = Object.entries(weatherMetricMap)
          .filter(([, value]) => Number.isFinite(value))
          .map(([, value]) => value);
        Object.entries(weatherMetricMap).forEach(([field, value]) => {
          if (!Number.isFinite(value)) excludedData.push(FIELD_LABELS.weather[field]);
        });
        const weatherScore = weatherSubscores.length
          ? Math.round(weatherSubscores.reduce((a, b) => a + b, 0) / weatherSubscores.length)
          : null;

        const aqiValue = Number(aqi?.aqi);
        const aqiScore = Number.isFinite(aqiValue)
          ? Math.round(clamp(100 - (aqiValue * 0.32), 0, 100))
          : null;
        if (!Number.isFinite(aqiScore)) excludedData.push(FIELD_LABELS.aqi.aqi);

        const uvValue = Number(uv?.uvi);
        const uvScore = Number.isFinite(uvValue)
          ? Math.round(clamp(100 - Math.max(0, uvValue - 2) * 12, 0, 100))
          : null;
        if (!Number.isFinite(uvScore)) excludedData.push(FIELD_LABELS.uv.uvi);

        const pollenRisk = String(pollen?.riskLevel || '').toLowerCase();
        const pollenScore = pollenRisk === 'low' ? 90 : pollenRisk === 'moderate' ? 60 : pollenRisk === 'high' ? 30 : null;
        if (!Number.isFinite(pollenScore)) excludedData.push(FIELD_LABELS.pollen.riskLevel);

        const soilMetricMap = {
          ph: scoreFromRange(Number(soil?.ph), 6.0, 7.8, 1.0),
          moisture: scoreFromRange(Number(soil?.moisture), 30, 70, 25),
          temperature: scoreFromRange(Number(soil?.temperature), 15, 32, 12),
        };
        const soilSubscores = Object.entries(soilMetricMap)
          .filter(([, value]) => Number.isFinite(value))
          .map(([, value]) => value);
        Object.entries(soilMetricMap).forEach(([field, value]) => {
          if (!Number.isFinite(value)) excludedData.push(FIELD_LABELS.soil[field]);
        });
        const soilScore = soilSubscores.length
          ? Math.round(soilSubscores.reduce((a, b) => a + b, 0) / soilSubscores.length)
          : null;

        const waterPollution = String(water?.pollutionLevel || '').toLowerCase();
        const pollutionScore = waterPollution === 'low' ? 90 : waterPollution === 'moderate' ? 60 : waterPollution === 'high' ? 30 : null;
        const waterMetricMap = {
          pollutionLevel: pollutionScore,
          ph: scoreFromRange(Number(water?.ph), 6.5, 8.5, 1.0),
          dissolvedOxygen: scoreFromRange(Number(water?.dissolvedOxygen), 6, 10, 3),
        };
        const waterSubscores = Object.entries(waterMetricMap)
          .filter(([, value]) => Number.isFinite(value))
          .map(([, value]) => value);
        Object.entries(waterMetricMap).forEach(([field, value]) => {
          if (!Number.isFinite(value)) excludedData.push(FIELD_LABELS.water[field]);
        });
        const waterScore = waterSubscores.length
          ? Math.round(waterSubscores.reduce((a, b) => a + b, 0) / waterSubscores.length)
          : null;

        const moduleScores = {
          weather: weatherScore,
          aqi: aqiScore,
          uv: uvScore,
          pollen: pollenScore,
          soil: soilScore,
          water: waterScore,
        };

        const weightedModules = [
          { key: 'weather', weight: 0.15 },
          { key: 'aqi', weight: 0.2 },
          { key: 'uv', weight: 0.1 },
          { key: 'pollen', weight: 0.15 },
          { key: 'soil', weight: 0.2 },
          { key: 'water', weight: 0.2 },
        ];

        let weightedSum = 0;
        let activeWeight = 0;
        const unavailableModules = [];

        weightedModules.forEach(({ key, weight }) => {
          const value = moduleScores[key];
          if (Number.isFinite(value)) {
            weightedSum += value * weight;
            activeWeight += weight;
          } else {
            unavailableModules.push(key);
          }
        });

        const score = activeWeight > 0 ? Math.round(weightedSum / activeWeight) : 0;

        const nextResult = {
          score,
          status: toStatus(score),
          moduleScores,
          unavailableModules,
          excludedData,
        };

        setResult(nextResult);
        onHealthCalculatedRef.current({
          score: nextResult.score,
          status: nextResult.status.label,
          moduleScores,
          unavailableModules,
          excludedData,
          hasLiveData: activeWeight > 0,
          updatedAt: activeWeight > 0 ? new Date().toISOString() : null,
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Unable to calculate ecosystem health.');
          onHealthCalculatedRef.current({
            score: 0,
            status: 'Unavailable',
            moduleScores: {},
            unavailableModules: ['weather', 'aqi', 'uv', 'pollen', 'soil', 'water'],
            excludedData: [
              'Weather',
              'Air Quality',
              'UV',
              'Pollen',
              'Soil',
              'Water',
            ],
            hasLiveData: false,
            updatedAt: new Date().toISOString(),
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [location?.lat, location?.lon]);

  const titleColor = useMemo(() => (isDarkMode ? 'text-white' : 'text-emerald-950'), [isDarkMode]);
  const bodyColor = useMemo(() => (isDarkMode ? 'text-slate-200/90' : 'text-emerald-900/90'), [isDarkMode]);
  const unavailableLabels = useMemo(
    () => result.unavailableModules.map((key) => MODULE_LABELS[key] || key),
    [result.unavailableModules]
  );
  const bannerExcludedData = useMemo(() => {
    const fromFields = Array.isArray(result.excludedData) ? result.excludedData : [];
    const fromModules = unavailableLabels;
    const merged = [...fromFields, ...fromModules];
    return Array.from(new Set(merged));
  }, [result.excludedData, unavailableLabels]);

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 border-2 ${isDarkMode ? 'border-emerald-700/40 bg-slate-800/40' : 'border-emerald-300/70 bg-white/90'}`}>
        <p className={`text-sm font-semibold ${bodyColor}`}>Calculating ecosystem health...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl p-6 border-2 ${isDarkMode ? 'border-rose-700/40 bg-rose-900/20' : 'border-rose-300/70 bg-rose-50/80'}`}>
        <h5 className={`text-lg font-bold mb-2 ${titleColor}`}>Overall Ecosystem Health</h5>
        <p className={`text-sm ${bodyColor}`}>Unable to calculate health: {error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 border-2 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/25 via-slate-800/40 to-teal-900/20 border-emerald-700/40 hover:border-emerald-600/60' : 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border-emerald-300/70 hover:border-emerald-400'}`}>
      <div className="flex items-center justify-between gap-8">
        <div className="flex-1">
          <h5 className={`text-lg font-bold mb-3 tracking-tight ${titleColor}`}>
            Overall Ecosystem Health
          </h5>
          <p className={`text-sm font-medium leading-relaxed ${result.status.color}`}>
            {result.status.label === 'Critical'
              ? '🚨 Critical - Immediate restoration action is urgently needed'
              : result.status.label === 'Fair'
              ? '⚠️ Fair - Monitor ecosystem carefully and prioritize conservation efforts'
              : '🌍 Excellent - Ecosystem is thriving with robust environmental stability'}
          </p>
          <p className={`text-xs mt-2 ${bodyColor}`}>{result.status.message}</p>
          {bannerExcludedData.length > 0 && (
            <div
              className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${
                isDarkMode
                  ? 'border-amber-700/50 bg-amber-900/20 text-amber-200'
                  : 'border-amber-300 bg-amber-50 text-amber-800'
              }`}
              role="status"
              aria-live="polite"
            >
              <p className="font-semibold">Excluded from calculation due to unavailable data:</p>
              <p className="mt-1">{bannerExcludedData.join(', ')}</p>
            </div>
          )}
        </div>

        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isDarkMode ? 'text-slate-700/50' : 'text-emerald-200/60'}
            />
            <defs>
              <linearGradient id="ecosystemHealthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDarkMode ? '#10b981' : '#059669'} />
                <stop offset="50%" stopColor={isDarkMode ? '#14b8a6' : '#0d9488'} />
                <stop offset="100%" stopColor={isDarkMode ? '#06b6d4' : '#0891b2'} />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#ecosystemHealthGradient)"
              strokeWidth="3"
              strokeDasharray={`${(result.score / 100) * 263.89} 263.89`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <Activity className={`w-4 h-4 mb-1 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`} />
            <span className={`text-2xl font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {result.score}
            </span>
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Score
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcosystemHealthCalculate;
