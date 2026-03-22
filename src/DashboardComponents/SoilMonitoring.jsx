import React, { useState, useMemo, useEffect } from 'react';
import { Droplets, Thermometer, Leaf, AlertCircle, MoreHorizontal, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { SoilAPI } from '../api';

/**
 * StatusBadge - Reusable status indicator component 
 */

const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    optimal: {
      bg: 'bg-emerald-100 dark:bg-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-200',
      label: 'Optimal',
    },
    good: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-200',
      label: 'Good',
    },
    moderate: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-700 dark:text-amber-200',
      label: 'Moderate',
    },
    dry: {
      bg: 'bg-orange-100 dark:bg-orange-900',
      text: 'text-orange-700 dark:text-orange-200',
      label: 'Dry',
    },
    wet: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-200',
      label: 'Wet',
    },
    acidic: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-200',
      label: 'Acidic',
    },
    neutral: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-200',
      label: 'Neutral',
    },
    alkaline: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-200',
      label: 'Alkaline',
    },
    poor: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-200',
      label: 'Poor',
    },
    medium: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-700 dark:text-amber-200',
      label: 'Medium',
    },
    high: {
      bg: 'bg-emerald-100 dark:bg-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-200',
      label: 'High',
    },
    na: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      label: 'N/A',
    },
    unv: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-200',
      label: 'UNV',
    },
    nc: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-200',
      label: 'NC',
    },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.moderate;

  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
};

/**
 * MetricCard - Reusable metric display component
 */
const MetricCard = ({ icon, label, value, unit, statusBadge, trend, trendDirection, color, isDarkMode = false }) => {
  const Icon = icon;
  const iconBgMap = {
    blue: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-500/15',
    green: isDarkMode ? 'bg-green-900/30' : 'bg-green-500/15',
    orange: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-500/15',
    red: isDarkMode ? 'bg-red-900/30' : 'bg-red-500/15',
  };

  const iconColorMap = {
    blue: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    green: isDarkMode ? 'text-green-400' : 'text-green-600',
    orange: isDarkMode ? 'text-orange-400' : 'text-orange-600',
    red: isDarkMode ? 'text-red-400' : 'text-red-600',
  };

  const borderColorMap = {
    blue: isDarkMode ? 'border-blue-700/20' : 'border-blue-200/40',
    green: isDarkMode ? 'border-green-700/20' : 'border-green-200/40',
    orange: isDarkMode ? 'border-orange-700/20' : 'border-orange-200/40',
    red: isDarkMode ? 'border-red-700/20' : 'border-red-200/40',
  };

  return (
    <div className={`rounded-lg p-2 transition-all duration-200 border ${
      isDarkMode ? 'bg-slate-800/30' : 'bg-white/50'
    } shadow-sm ${borderColorMap[color]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className={`w-5 h-5 ${iconBgMap[color]} rounded flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-2.5 h-2.5 ${iconColorMap[color]}`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-semibold ${
            trendDirection === 'up'
              ? isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100/60 text-green-700'
              : isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100/60 text-red-700'
          }`}>
            {trendDirection === 'up' ? (
              <TrendingUp className="w-2 h-2" />
            ) : (
              <TrendingDown className="w-2 h-2" />
            )}
            <span className="text-xs">{trend}%</span>
          </div>
        )}
      </div>

      {/* Label */}
      <span className={`text-xs font-medium block mb-1 truncate ${
        isDarkMode ? 'text-slate-400' : 'text-slate-600'
      }`}>
        {label}
      </span>

      {/* Value */}
      <div className="flex items-baseline gap-0.5 mb-1.5">
        <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </span>
        {unit && (
          <span className={`text-xs font-normal ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {unit}
          </span>
        )}
      </div>

      {/* Status Badge */}
      {statusBadge && (
        <div>
          <StatusBadge status={statusBadge} />
        </div>
      )}
    </div>
  );
};

/**
 * SoilMonitoringCard - Premium Soil Monitoring Dashboard Component
 * 
 * @param {Object} props
 * @param {Object} props.location - Location coordinates {lat, lon}
 * @param {boolean} props.isLoading - Loading state
 * @param {function} props.onMenuClick - Menu action handler
 * @param {Object} props.trends - Trend data {moisture, temperature, ph, nutrient}
 */
const SoilMonitoringCard = ({
  location = null,
  isLoading: externalLoading = false,
  onMenuClick = () => {},
  trends = { moisture: 0, temperature: 0, ph: 0, nutrient: 0 },
  trendDirections = { moisture: 'stable', temperature: 'stable', ph: 'stable', nutrient: 'stable' },
  isDarkMode = false,
}) => {
  const [soilSnapshot, setSoilSnapshot] = useState({
    current: null,
    previous: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const lat = Number(location?.lat);
    const lon = Number(location?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    const isManualRefresh = refreshKey > 0;

    let cancelled = false;
    let timeoutId = null;

    const loadSoilData = async () => {
      setIsLoading(true);
      setError(null);

      // Hard timeout: Force loading state to clear after 6 seconds to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.warn('⏱️ Soil data fetch timeout - clearing loading state');
          setIsLoading(false);
        }
      }, 6000);

      try {
        const liveSoilData = await SoilAPI.get(lat, lon, { force: isManualRefresh });
        if (cancelled) return;

        clearTimeout(timeoutId);
        setSoilSnapshot((prev) => ({
          current: liveSoilData,
          previous: prev.current,
        }));
        setIsLoading(false);
      } catch (fetchError) {
        if (cancelled) return;

        clearTimeout(timeoutId);
        setSoilSnapshot((prev) => ({
          current: null,
          previous: prev.previous,
        }));
        setError(fetchError?.message || 'Failed to fetch live soil data.');
        setIsLoading(false);
      }
    };

    loadSoilData();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [location?.lat, location?.lon, refreshKey]);

  // ========================================
  // USE REAL DATA OR FALLBACK
  // ========================================
  const displayMoisture = soilSnapshot.current?.moisture ?? null;
  const displayTemperature = soilSnapshot.current?.temperature ?? null;
  const displayPh = soilSnapshot.current?.ph ?? null;
  const displaySoc = soilSnapshot.current?.soc ?? null;
  const soilAvailability = soilSnapshot.current?.soilAvailability ?? null;
  const actualLoading = isLoading || externalLoading;
  const hasValidLocation = Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lon));
  const displayError = hasValidLocation
    ? error
    : 'Location coordinates are missing for live soil data.';
  const hasMoisture =
    displayMoisture !== null &&
    displayMoisture !== undefined &&
    Number.isFinite(Number(displayMoisture));
  const hasTemperature =
    displayTemperature !== null &&
    displayTemperature !== undefined &&
    Number.isFinite(Number(displayTemperature));
  const hasPh =
    displayPh !== null &&
    displayPh !== undefined &&
    Number.isFinite(Number(displayPh)) &&
    soilAvailability !== 'unavailable';
  const hasSoc =
    typeof displaySoc === 'string' &&
    displaySoc.length > 0 &&
    soilAvailability !== 'unavailable';
  const hasRenderableData = hasMoisture || hasTemperature || hasPh || hasSoc;

  const getIsricToken = (hasValue) => {
    if (!hasValidLocation) return 'NC';
    if (soilAvailability === 'unavailable') return 'UNV';
    if (!hasValue) return 'N/A';
    return null;
  };

  const phToken = getIsricToken(hasPh);
  const socToken = getIsricToken(hasSoc);

  const getTokenBadge = (token) => {
    if (token === 'NC') return 'nc';
    if (token === 'UNV') return 'unv';
    if (token === 'N/A') return 'na';
    return 'moderate';
  };

  // ========================================
  // DYNAMIC TRENDS: Compare current vs previous snapshot
  // ========================================
  const resolvedTrends = useMemo(() => {
    const current = soilSnapshot.current;
    const previous = soilSnapshot.previous;

    if (!current || !previous) {
      return {
        values: trends,
        directions: trendDirections,
      };
    }

    const nutrientScore = { Poor: 1, Medium: 2, High: 3 };
    const computePercent = (prev, current) => {
      if (prev == null || current == null) return 0;
      if (prev === 0) return 0;
      return Math.round(((current - prev) / Math.abs(prev)) * 100);
    };

    const moistureTrend = computePercent(previous.moisture, current.moisture);
    const temperatureTrend = computePercent(previous.temperature, current.temperature);
    const phTrend = computePercent(previous.ph, current.ph);
    const nutrientTrend = computePercent(
      nutrientScore[previous.soc] ?? 0,
      nutrientScore[current.soc] ?? 0
    );

    const toDirection = (value) => {
      if (value > 0) return 'up';
      if (value < 0) return 'down';
      return 'stable';
    };

    return {
      values: {
        moisture: Math.abs(moistureTrend),
        temperature: Math.abs(temperatureTrend),
        ph: Math.abs(phTrend),
        nutrient: Math.abs(nutrientTrend),
      },
      directions: {
        moisture: toDirection(moistureTrend),
        temperature: toDirection(temperatureTrend),
        ph: toDirection(phTrend),
        nutrient: toDirection(nutrientTrend),
      },
    };
  }, [soilSnapshot, trends, trendDirections]);



  // Compute moisture status
  const moistureData = useMemo(() => {
    if (!hasMoisture) return { status: 'Unavailable', badge: 'moderate', color: 'blue' };
    if (displayMoisture < 25) return { status: 'Dry', badge: 'dry', color: 'orange' };
    if (displayMoisture < 40) return { status: 'Dry', badge: 'dry', color: 'orange' };
    if (displayMoisture <= 65) return { status: 'Optimal', badge: 'optimal', color: 'green' };
    return { status: 'Wet', badge: 'wet', color: 'blue' };
  }, [displayMoisture, hasMoisture]);

  // Compute pH status (use real data)
  const phData = useMemo(() => {
    if (
      displayPh === null ||
      displayPh === undefined ||
      !Number.isFinite(Number(displayPh)) ||
      soilAvailability === 'unavailable'
    ) {
      return { status: 'Unavailable', badge: 'moderate', color: 'blue' };
    }
    if (displayPh < 6) return { status: 'Acidic', badge: 'acidic', color: 'red' };
    if (displayPh < 7.3) return { status: 'Neutral', badge: 'neutral', color: 'green' };
    return { status: 'Alkaline', badge: 'alkaline', color: 'blue' };
  }, [displayPh, soilAvailability]);

  // Compute nutrient status (use real data)
  const nutrientColor = useMemo(() => {
    if (!hasSoc) return 'blue';
    if (displaySoc === 'Poor') return 'red';
    if (displaySoc === 'Medium') return 'orange';
    return 'green';
  }, [displaySoc, hasSoc]);

  // Compute temperature status
  const tempData = useMemo(() => {
    if (!hasTemperature) return { status: 'Unavailable', badge: 'moderate', color: 'blue' };
    if (displayTemperature < 10) return { status: 'Cold', badge: 'moderate', color: 'blue' };
    if (displayTemperature <= 35) return { status: 'Optimal', badge: 'optimal', color: 'green' };
    return { status: 'Hot', badge: 'moderate', color: 'orange' };
  }, [displayTemperature, hasTemperature]);

  if (actualLoading) {
    return (
      <div className={`rounded-2xl p-4 sm:p-6 shadow-lg transition-all duration-300 ${
        isDarkMode
          ? 'bg-slate-800 border border-slate-700/60'
          : 'bg-white border border-emerald-200/60'
      }`}>
        <div className="space-y-4">
          <div className={`h-6 rounded w-1/3 animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-emerald-100'}`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-32 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-emerald-50'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasRenderableData) {
    return (
      <div className={`rounded-2xl p-4 sm:p-6 shadow-lg border ${
        isDarkMode
          ? 'bg-red-900/20 border-red-800 text-red-200'
          : 'bg-red-50 border-red-200 text-red-700'
      }`} role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold mb-1">Unable to load soil data</h3>
            <p className="text-sm opacity-90">{displayError || 'No live soil metrics were returned by the API.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col min-h-[430px] overflow-hidden ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 hover:border-slate-600/80 backdrop-blur-sm'
          : 'bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-200/60 hover:border-emerald-300/80 backdrop-blur-sm'
      }`}
      style={{ animation: 'slideUp 0.5s ease-out' }}
      role="region"
      aria-label="Soil monitoring information"
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .menu-enter { animation: slideIn 0.2s ease-out; }
      `}</style>
      {/* Header */}
      <div className={`flex items-center justify-between flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-0 border-b ${
        isDarkMode ? 'border-slate-700/30' : 'border-emerald-200/30'
      }`}>
        <div className="flex items-center gap-2">
          <Leaf className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Soil Monitoring
          </h2>
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setIsMenuOpen((prev) => !prev);
              onMenuClick();
            }}
            className={`p-1.5 rounded-lg transition-all duration-150 ${
              isDarkMode
                ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/60'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-100/50'
            }`}
            aria-label="Soil monitoring card options"
            aria-expanded={isMenuOpen}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className={`absolute right-0 mt-2 w-40 rounded-lg border shadow-lg z-20 menu-enter ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-emerald-100'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setRefreshKey((prev) => prev + 1);
                }}
                disabled={actualLoading}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'text-slate-200 hover:bg-slate-700'
                    : 'text-slate-700 hover:bg-emerald-50'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${actualLoading ? 'animate-spin' : ''}`} />
                Refresh data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 py-2 sm:py-2.5 space-y-1">
        <div className="grid grid-cols-2 gap-1.5 mb-1">
          {/* Soil Moisture */}
          <MetricCard
            icon={Droplets}
            label="Soil Moisture"
            value={hasMoisture ? Number(displayMoisture) : '--'}
            unit={hasMoisture ? '%' : ''}
            statusBadge={moistureData.badge}
            trend={resolvedTrends.values.moisture}
            trendDirection={resolvedTrends.directions.moisture}
            color={moistureData.color}
            isDarkMode={isDarkMode}
          />

          {/* Temperature */}
          <MetricCard
            icon={Thermometer}
            label="Soil Temperature"
            value={hasTemperature ? Number(displayTemperature) : '--'}
            unit={hasTemperature ? '°C' : ''}
            statusBadge={tempData.badge}
            trend={resolvedTrends.values.temperature}
            trendDirection={resolvedTrends.directions.temperature}
            color={tempData.color}
            isDarkMode={isDarkMode}
          />

          {/* Soil pH */}
          <MetricCard
            icon={AlertCircle}
            label="Soil pH"
            value={hasPh ? Number(displayPh).toFixed(1) : phToken}
            statusBadge={hasPh ? phData.badge : getTokenBadge(phToken)}
            trend={resolvedTrends.values.ph}
            trendDirection={resolvedTrends.directions.ph}
            color={phData.color}
            isDarkMode={isDarkMode}
          />

          {/* Nutrient Level */}
          <MetricCard
            icon={Leaf}
            label="Nutrient Level"
            value={hasSoc ? displaySoc : socToken}
            statusBadge={hasSoc ? displaySoc : getTokenBadge(socToken)}
            trend={resolvedTrends.values.nutrient}
            trendDirection={resolvedTrends.directions.nutrient}
            color={nutrientColor}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Summary Section */}
        <div className={`border-t ${
          isDarkMode ? 'border-slate-700/30' : 'border-emerald-200/30'
        } pt-1`}>
          <h4 className={`text-xs font-semibold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          } mb-1 flex items-center gap-1`}>
            <AlertCircle className="w-2.5 h-2.5" />
            Health Summary
          </h4>

          <div className="grid grid-cols-3 gap-1.5">
            {/* Moisture Assessment */}
            <div className={`rounded-lg p-1 border ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-700/40' 
                : 'bg-blue-100 border-blue-400/70'
            }`}>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium block mb-0.5">💧</span>
              <span className={`text-xs font-bold line-clamp-1 uppercase tracking-tight ${
                isDarkMode ? 'text-white' : 'text-blue-950'
              }`}>
                {hasMoisture ? (displayMoisture < 30 ? 'Critical' : displayMoisture < 45 ? 'Low' : 'Balanced') : 'Unavailable'}
              </span>
            </div>

            {/* Temperature Assessment */}
            <div className={`rounded-lg p-1 border ${
              isDarkMode 
                ? 'bg-orange-900/20 border-orange-700/40' 
                : 'bg-orange-100 border-orange-400/70'
            }`}>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium block mb-0.5">🌡️</span>
              <span className={`text-xs font-bold line-clamp-1 uppercase tracking-tight ${
                isDarkMode ? 'text-white' : 'text-orange-950'
              }`}>
                {hasTemperature ? (displayTemperature < 10 ? 'Cold' : displayTemperature > 35 ? 'Hot' : 'Ideal') : 'Unavailable'}
              </span>
            </div>

            {/* pH Assessment */}
            <div className={`rounded-lg p-1 border ${
              isDarkMode 
                ? 'bg-green-900/20 border-green-700/40' 
                : 'bg-green-100 border-green-400/70'
            }`}>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium block mb-0.5">🌱</span>
              <span className={`text-xs font-bold line-clamp-1 uppercase tracking-tight ${
                isDarkMode ? 'text-white' : 'text-green-950'
              }`}>
                {phData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Overall Status */}
      <div className={`flex-shrink-0 text-xs text-center px-4 sm:px-6 pb-3 sm:pb-4 pt-0 ${
        isDarkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        🌾 Live soil feed from NASA SMAP + Open-Meteo + ISRIC
      </div>
    </div>
  );
};

export default SoilMonitoringCard;