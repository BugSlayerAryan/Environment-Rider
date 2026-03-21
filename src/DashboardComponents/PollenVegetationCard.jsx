import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Leaf, Wind, AlertCircle, MoreHorizontal, RefreshCw } from 'lucide-react';
import { PollenAPI } from '../api';

const BREAKDOWN_META = {
  Grass: { color: 'bg-green-400 dark:bg-green-500' },
  Tree: { color: 'bg-teal-400 dark:bg-teal-500' },
  Weed: { color: 'bg-lime-400 dark:bg-lime-500' },
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT = 6000; // 6 seconds (restored - 2.5s was too aggressive)

const classifyRiskLevel = (total) => {
  if (total > 150) return 'High';
  if (total > 80) return 'Moderate';
  return 'Low';
};

// ═══════════════════════════════════════════════════════════════
// CACHE MANAGEMENT
// ═══════════════════════════════════════════════════════════════
const pollenCache = new Map();

const getCachedData = (key) => {
  const cached = pollenCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    pollenCache.delete(key);
    return null;
  }
  return cached.data;
};

const setCachedData = (key, data) => {
  pollenCache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const generateCacheKey = (lat, lon) => `${lat.toFixed(4)},${lon.toFixed(4)}`;

/**
 * StatusBadge - Reusable status indicator component
 */
const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = useMemo(() => ({
    low: {
      bg: 'bg-emerald-100 dark:bg-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-200',
      label: 'Low',
    },
    moderate: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-700 dark:text-amber-200',
      label: 'Moderate',
    },
    high: {
      bg: 'bg-orange-100 dark:bg-orange-900',
      text: 'text-orange-700 dark:text-orange-200',
      label: 'High',
    },
    unv: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      label: 'UNV',
    },
  }), []);

  const config = statusConfig[status?.toLowerCase()] || statusConfig.low;

  return (
    <span className={`inline-block px-3 py-1.5 text-sm font-semibold rounded-lg ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
};

/**
 * ProgressBar - Animated progress indicator
 */
const ProgressBar = ({ value, max = 100, showLabel = true, className = '' }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const hasNumericValue = value !== null && value !== undefined && Number.isFinite(Number(value));
  const normalizedValue = hasNumericValue ? Number(value) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(normalizedValue), 100);
    return () => clearTimeout(timer);
  }, [normalizedValue]);

  const percentage = useMemo(() => Math.min((animatedValue / max) * 100, 100), [animatedValue, max]);

  return (
    <div className={className}>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 dark:from-emerald-500 dark:via-green-600 dark:to-teal-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={animatedValue}
          aria-valuemin="0"
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Vegetation Coverage</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{hasNumericValue ? `${percentage.toFixed(0)}%` : '--'}</span>
        </div>
      )}
    </div>
  );
};

/**
 * PollenChart - Mini bar chart for pollen breakdown
 */
const PollenChart = ({ data, isLoading }) => {
  const maxValue = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return 1;
    return Math.max(...data.map((d) => Number(d.value) || 0), 1);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-end justify-around h-24 gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t animate-pulse h-16" />
        ))}
      </div>
    );
  }

  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center">
        <span className="text-xs text-slate-500 dark:text-slate-400">No live breakdown data</span>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-around h-24 gap-1.5">
      {safeData.map((item, index) => {
        const hasNumericValue = Number.isFinite(Number(item.value));
        const numericValue = hasNumericValue ? Number(item.value) : 0;
        const percentage = (numericValue / maxValue) * 100;
        
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="w-full h-full flex items-end justify-center">
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ease-out ${item.color} shadow-md hover:shadow-lg hover:scale-105`}
                style={{
                  height: `${hasNumericValue ? percentage : 0}%`,
                }}
                role="img"
                aria-label={`${item.name}: ${hasNumericValue ? numericValue : 'Unavailable'} grains/m³`}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">{item.name}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{hasNumericValue ? numericValue : '--'}</span>
          </div>
        );
      })}
    </div>
  );
};

const PollenVegetationCard = ({
  isDarkMode = false,
  location = { lat: 28.6139, lon: 77.2090 },
  showMenu = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const menuRef = useRef(null);

  const [pollenLevel, setPollenLevel] = useState('Low');
  const [pollenCount, setPollenCount] = useState(null);
  const [vegetationPercent, setVegetationPercent] = useState(null);
  const [pollenBreakdown, setPollenBreakdown] = useState([]);
  const [healthHint, setHealthHint] = useState(null);
  const [isPollenUnavailable, setIsPollenUnavailable] = useState(false);
  
  const lastAutoFetchKeyRef = useRef(null);
  const fetchAbortControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  
  const hasVegetationData = useMemo(
    () => Number.isFinite(Number(vegetationPercent)) && Number(vegetationPercent) > 0,
    [vegetationPercent]
  );

  // Optimized data parsing
  const parsePollenResponse = useCallback((response) => {
    const parseDetailsMessage = (details) => {
      if (!details) return null;

      if (typeof details === 'string') {
        try {
          const parsed = JSON.parse(details);
          if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
            return parsed.message.trim();
          }
        } catch {
          return details.trim() || null;
        }
        return details.trim() || null;
      }

      if (typeof details === 'object' && typeof details.message === 'string') {
        return details.message.trim() || null;
      }

      return null;
    };

    const toMetric = (value) => {
      if (value === null || value === undefined) return null;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const grass = toMetric(response.grass);
    const tree = toMetric(response.tree);
    const weed = toMetric(response.weed);
    const totalFromParts = [grass, tree, weed].every((v) => Number.isFinite(v))
      ? grass + tree + weed
      : null;

    const total = Number.isFinite(Number(response.pollenCount))
      ? Number(response.pollenCount)
      : totalFromParts;

    const hasPollenData = Number.isFinite(total);
    const isUnavailable = response.pollenUnavailable || response.unavailable || false;
    const unavailableReason = parseDetailsMessage(response.details);

    const riskLevel = hasPollenData
      ? (response.riskLevel || classifyRiskLevel(total))
      : (isUnavailable ? 'UNV' : 'Low');

    const hints = {
      Low: '✓ Good for outdoor activities',
      Moderate: '⚠ Mild allergy risk, consider precautions',
      High: '✕ High allergy risk, limit outdoor time',
      UNV: 'Pollen data unavailable',
    };

    const vegetationMetric = response.vegetationIndex;
    const vegetationValue = vegetationMetric === null || vegetationMetric === undefined
      ? null
      : Number(vegetationMetric);

    return {
      hasPollenData,
      pollenCount: hasPollenData ? total : null,
      riskLevel,
      healthHint: hasPollenData
        ? hints[riskLevel]
        : unavailableReason || (Number(response?.status) === 422
          ? 'Pollen API usage limit reached. Showing vegetation-only fallback.'
          : 'Live pollen data is temporarily unavailable'),
      pollenBreakdown: [
        { name: 'Grass', value: grass, ...BREAKDOWN_META.Grass },
        { name: 'Tree', value: tree, ...BREAKDOWN_META.Tree },
        { name: 'Weed', value: weed, ...BREAKDOWN_META.Weed },
      ],
      vegetationPercent: Number.isFinite(vegetationValue) ? vegetationValue : null,
      isPollenUnavailable: isUnavailable,
      hasError: !hasPollenData && !Number.isFinite(vegetationValue) && !isUnavailable,
    };
  }, []);

  // Fetch pollen data with timeout and caching
  const fetchPollenData = useCallback(async (options = {}) => {
    const { force = false } = options;
    
    try {
      const lat = Number(location?.lat);
      const lon = Number(location?.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const cacheKey = generateCacheKey(lat, lon);

      // Check cache first (unless forcing refresh)
      if (!force) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          // Batch state updates using single setState
          setIsLoading(false);
          setPollenCount(cachedData.pollenCount);
          setPollenLevel(cachedData.riskLevel);
          setHealthHint(cachedData.healthHint);
          setPollenBreakdown(cachedData.pollenBreakdown);
          setVegetationPercent(cachedData.vegetationPercent);
          setIsPollenUnavailable(cachedData.isPollenUnavailable);
          setHasError(cachedData.hasError);
          return;
        }
      }

      setIsLoading(true);
      setHasError(false);

      // Cancel previous request for faster response
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }

      // Create abort controller with shorter timeout
      fetchAbortControllerRef.current = new AbortController();
      fetchTimeoutRef.current = setTimeout(() => {
        fetchAbortControllerRef.current?.abort();
      }, FETCH_TIMEOUT);

      console.log('🌿 Fetching pollen data for:', { lat, lon });

      const response = await PollenAPI.get(lat, lon, { force });

      if (!response) {
        throw new Error('No pollen data received');
      }

      // Debug: Log raw API response
      console.log('🌿 Raw API response:', {
        unavailable: response.unavailable,
        pollenUnavailable: response.pollenUnavailable,
        status: response.status,
        details: response.details,
        pollenCount: response.pollenCount,
        vegetationIndex: response.vegetationIndex,
        hasPollenData: response.pollenCount !== null && Number.isFinite(Number(response.pollenCount)),
      });

      const parsedData = parsePollenResponse(response);

      // Cache the successful response
      setCachedData(cacheKey, parsedData);

      // Batch all state updates together for performance (reduced renders)
      setIsLoading(false);
      setPollenCount(parsedData.pollenCount);
      setPollenLevel(parsedData.riskLevel);
      setHealthHint(parsedData.healthHint);
      setPollenBreakdown(parsedData.pollenBreakdown);
      setVegetationPercent(parsedData.vegetationPercent);
      setIsPollenUnavailable(parsedData.isPollenUnavailable);
      setHasError(parsedData.hasError);

      console.log('🌿 Pollen data fetched successfully');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Pollen Fetch Error:', error);
        setHasError(true);
      }
    } finally {
      clearTimeout(fetchTimeoutRef.current);
      setIsLoading(false);
    }
  }, [location, parsePollenResponse]);

  // Fetch data on location change with optimized debounce
  useEffect(() => {
    const lat = Number(location?.lat);
    const lon = Number(location?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setIsLoading(false);
      setHasError(false);
      setHealthHint('Location coordinates are missing. Select a valid location.');
      setPollenCount(null);
      setPollenLevel('Low');
      setPollenBreakdown([]);
      setVegetationPercent(null);
      setIsPollenUnavailable(false);
      return;
    }

    const fetchKey = generateCacheKey(lat, lon);
    
    if (lastAutoFetchKeyRef.current === fetchKey) {
      return;
    }
    
    lastAutoFetchKeyRef.current = fetchKey;

    const timer = setTimeout(() => {
      fetchPollenData();
    }, 300);

    return () => clearTimeout(timer);
  }, [location?.lat, location?.lon, fetchPollenData]);

  // Handle refresh with debounce
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchPollenData({ force: true });
    } catch (error) {
      console.error('Pollen data refresh failed:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [isRefreshing, fetchPollenData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Skeleton loading state
  if (isLoading) {
    return (
      <div 
        className={`rounded-2xl p-4 sm:p-6 shadow-lg transition-all duration-300 ${
          isDarkMode
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-gray-100'
        }`} 
        role="status" 
        aria-label="Loading pollen information" 
        aria-busy="true"
      >
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-6"></div>
          </div>
          <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded-lg w-full"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - only show for REAL errors, not unavailable data
  if (hasError && !isPollenUnavailable) {
    return (
      <div 
        className={`rounded-2xl p-4 sm:p-6 shadow-lg border ${
          isDarkMode
            ? 'bg-red-900/20 border-red-800 text-red-200'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-semibold mb-1">Unable to load pollen data</h3>
            <p className="text-sm opacity-90">Please try refreshing the data.</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`mt-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-red-800/50 hover:bg-red-800 disabled:opacity-50'
                  : 'bg-red-100 hover:bg-red-200 disabled:opacity-50'
              }`}
              aria-label="Retry loading pollen data"
            >
              {isRefreshing ? 'Retrying...' : 'Retry'}
            </button>
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
          : 'bg-white border border-emerald-200/60 hover:border-emerald-300/80 backdrop-blur-sm'
      } opacity-100`}
      style={{ animation: 'slideUp 0.5s ease-out' }}
      role="region"
      aria-label="Pollen and vegetation information"
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
        <div>
          <h3 className={`font-bold text-base sm:text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Leaf className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Pollen & Vegetation
          </h3>
        </div>

        {showMenu && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsMenuOpen(false);
                if (e.key === 'Enter') setIsMenuOpen(!isMenuOpen);
              }}
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg transition-all duration-150 hover:shadow-md group cursor-pointer disabled:opacity-50 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/60'
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-100'
              }`}
              aria-label="Pollen and vegetation card options"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              type="button"
            >
              <MoreHorizontal className="w-5 h-5 transition-transform group-hover:scale-110" aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div 
                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-2xl overflow-hidden z-50 transition-all duration-200 menu-enter backdrop-blur-md ${
                  isDarkMode
                    ? 'bg-slate-700/95 border border-slate-600/70'
                    : 'bg-white/95 border border-gray-200/70'
                }`} 
                role="menu"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                    setIsMenuOpen(false);
                  }}
                  disabled={isRefreshing}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    isDarkMode
                      ? 'text-gray-200 hover:bg-slate-600/50'
                      : 'text-slate-700 hover:bg-emerald-50'
                  } flex items-center gap-2`}
                  aria-label="Refresh pollen data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 py-2 sm:py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 mb-3">
          {/* Left Side - Pollen Count */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Pollen Count</span>
                <span className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isPollenUnavailable ? 'UNV' : (pollenCount ?? '--')}
                  <span className={`text-xs font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} ml-1`}>grains/m³</span>
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{healthHint || 'Live pollen data loaded'}</p>
            </div>

            {/* Status Badge */}
            <div className="pt-0.5">
              <StatusBadge status={pollenLevel} />
            </div>

            {/* Summary Stats */}
            <div className={`pt-1 space-y-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Impact Level</span>
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                    isPollenUnavailable
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      : pollenLevel === 'High'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      : pollenLevel === 'Moderate'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{isPollenUnavailable ? 'UNV' : pollenLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Pollen Chart */}
          <div className={`rounded-lg p-2 sm:p-2.5 border shadow-sm ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-slate-700/70'
              : 'bg-gradient-to-br from-emerald-50/60 to-cyan-50/70 border-emerald-200/70'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className={`text-xs font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Wind className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                Breakdown
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                isPollenUnavailable
                  ? isDarkMode
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                  : isDarkMode
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {isPollenUnavailable ? 'UNV' : 'LIVE'}
              </span>
            </div>
            <PollenChart data={pollenBreakdown} isLoading={isLoading} />
          </div>
        </div>

        {/* Vegetation Section */}
        <div className={`border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} pt-2 space-y-2 mt-1`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Leaf className={`w-3.5 h-3.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              Vegetation Density
            </h4>
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Green Coverage</span>
          </div>

          <ProgressBar
            value={hasVegetationData ? vegetationPercent : null}
            max={100}
            showLabel={true}
            className="mt-1"
          />

          {/* Vegetation Details */}
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <div className={`rounded-lg p-2 border ${
              isDarkMode
                ? 'bg-emerald-900/20 border-emerald-800/50'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className={`text-xs font-medium block mb-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Healthy</span>
              <span className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{hasVegetationData ? `${vegetationPercent}%` : '--'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className={`flex-shrink-0 text-xs text-center px-4 sm:px-6 pb-3 sm:pb-4 pt-0 transition-opacity hover:opacity-100 ${
        isDarkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        🌿 Real-time pollen monitoring
      </div>
    </div>
  );
};

export default PollenVegetationCard;