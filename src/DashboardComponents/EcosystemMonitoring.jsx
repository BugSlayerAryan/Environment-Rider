import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Leaf, Trees, Globe, MoreHorizontal, TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';
import { EcosystemAPI } from '../api';
import EcosystemHealthCalculate from './EcosystemHealthCalculate';

/**
 * StatusBadge - Reusable status indicator component
 */
const StatusBadge = ({ status, className = '', isDarkMode = false }) => {
  const statusConfig = {
    low: {
      bg: isDarkMode ? 'bg-red-900/40' : 'bg-red-50',
      text: isDarkMode ? 'text-red-300' : 'text-red-700',
      border: isDarkMode ? 'border-red-700/40' : 'border-red-200/60',
      label: 'Low',
    },
    moderate: {
      bg: isDarkMode ? 'bg-amber-900/40' : 'bg-amber-50',
      text: isDarkMode ? 'text-amber-300' : 'text-amber-700',
      border: isDarkMode ? 'border-amber-700/40' : 'border-amber-200/60',
      label: 'Moderate',
    },
    high: {
      bg: isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-50',
      text: isDarkMode ? 'text-emerald-300' : 'text-emerald-700',
      border: isDarkMode ? 'border-emerald-700/40' : 'border-emerald-200/60',
      label: 'High',
    },
    healthy: {
      bg: isDarkMode ? 'bg-green-900/40' : 'bg-green-50',
      text: isDarkMode ? 'text-green-300' : 'text-green-700',
      border: isDarkMode ? 'border-green-700/40' : 'border-green-200/60',
      label: 'Healthy',
    },
    critical: {
      bg: isDarkMode ? 'bg-rose-900/40' : 'bg-rose-50',
      text: isDarkMode ? 'text-rose-300' : 'text-rose-700',
      border: isDarkMode ? 'border-rose-700/40' : 'border-rose-200/60',
      label: 'Critical',
    },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.moderate;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.label}
    </span>
  );
};

/**
 * ProgressBar - Animated gradient progress indicator
 */
const ProgressBar = ({ value, max = 100, showLabel = true, className = '', variant = 'green' }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = Math.min((animatedValue / max) * 100, 100);

  const variantMap = {
    green: 'from-emerald-400 via-green-500 to-teal-600 dark:from-emerald-500 dark:via-green-600 dark:to-teal-700',
    lime: 'from-lime-400 via-green-500 to-emerald-600 dark:from-lime-500 dark:via-green-600 dark:to-emerald-700',
    forest: 'from-teal-400 via-emerald-500 to-green-600 dark:from-teal-500 dark:via-emerald-600 dark:to-green-700',
  };

  return (
    <div className={className}>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className={`h-full bg-gradient-to-r ${variantMap[variant] || variantMap.green} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={animatedValue}
          aria-valuemin="0"
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Progress</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
};

/**
 * CircularProgress - Circular progress indicator for metrics
 */
const CircularProgress = ({ value, max = 1, label, color = 'emerald' }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = ((animatedValue / max) * 100).toFixed(0);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorConfigs = {
    emerald: {
      progressStroke: { light: '#059669', dark: '#10b981' },
      containerBg: 'bg-gradient-to-br from-white/85 to-emerald-50/40 dark:from-emerald-950/50 dark:to-slate-900/70',
      containerBorder: 'border-emerald-200/70 dark:border-emerald-800/50',
      numberText: 'text-emerald-950 dark:text-emerald-300',
      labelText: 'text-emerald-700 dark:text-emerald-400',
      ringColor: 'ring-emerald-100/80 dark:ring-emerald-900/50',
    },
    green: {
      progressStroke: { light: '#16a34a', dark: '#22c55e' },
      containerBg: 'bg-gradient-to-br from-white/85 to-green-50/40 dark:from-green-950/50 dark:to-slate-900/70',
      containerBorder: 'border-green-200/70 dark:border-green-800/50',
      numberText: 'text-green-950 dark:text-green-300',
      labelText: 'text-green-700 dark:text-green-400',
      ringColor: 'ring-green-100/80 dark:ring-green-900/50',
    },
    teal: {
      progressStroke: { light: '#0d9488', dark: '#14b8a6' },
      containerBg: 'bg-gradient-to-br from-white/85 to-teal-50/40 dark:from-teal-950/50 dark:to-slate-900/70',
      containerBorder: 'border-teal-200/70 dark:border-teal-800/50',
      numberText: 'text-teal-950 dark:text-teal-300',
      labelText: 'text-teal-700 dark:text-teal-400',
      ringColor: 'ring-teal-100/80 dark:ring-teal-900/50',
    },
  };

  const config = colorConfigs[color] || colorConfigs.emerald;

  return (
    <div className="flex flex-col items-center justify-center">
      <style>{`
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .subtle-pulse { animation: subtle-pulse 3.5s ease-in-out infinite; }
      `}</style>
      
      <div className={`relative w-44 h-44 mb-5 flex items-center justify-center rounded-full ${config.containerBg} border-2 ${config.containerBorder} shadow-2xl dark:shadow-inner ${config.ringColor} ring-2 backdrop-blur-xl transition-all duration-300 hover:shadow-inner hover:dark:shadow-2xl subtle-pulse`}>
        
        <svg className="w-40 h-40 transform -rotate-90 absolute" viewBox="0 0 100 100">
          <defs>
            {/* Subtle background gradient */}
            <linearGradient id={`bgGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.1" />
            </linearGradient>
            
            {/* Premium progress gradient */}
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.progressStroke.light} stopOpacity="1" />
              <stop offset="100%" stopColor={config.progressStroke.dark} stopOpacity="0.95" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id={`glow-${color}`}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Subtle background track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#bgGrad-${color})"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Progress circle with professional glow */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`url(#gradient-${color})`}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            filter={`url(#glow-${color})`}
          />
        </svg>

        {/* Center content with premium styling */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className={`text-6xl font-black tracking-tighter leading-none ${config.numberText}`}>
            {(animatedValue * 100).toFixed(0)}
          </div>
          <div className={`text-xs font-extrabold uppercase tracking-widest mt-2.5 opacity-90 ${config.labelText}`}>
            Score
          </div>
        </div>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-center text-slate-700 dark:text-slate-300 px-4 mt-4 leading-snug">
        {label}
      </span>
    </div>
  );
};

/**
 * MetricItem - Reusable metric display component
 */
// eslint-disable-next-line no-unused-vars
const MetricItem = ({ icon: Icon, label, value, unit, status, statusBadge, color = 'emerald', isDarkMode = false }) => {
  const iconBgMap = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
    green: 'bg-green-100 dark:bg-green-900/40',
    teal: 'bg-teal-100 dark:bg-teal-900/40',
  };

  const iconColorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-300',
    green: 'text-green-600 dark:text-green-300',
    teal: 'text-teal-600 dark:text-teal-300',
  };

  const borderColorMap = {
    emerald: 'border-emerald-200 dark:border-emerald-800/40',
    green: 'border-green-200 dark:border-green-800/40',
    teal: 'border-teal-200 dark:border-teal-800/40',
  };

  return (
    <div className={`rounded-xl p-4 border ${borderColorMap[color]} hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white dark:bg-slate-800/60`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${iconBgMap[color]} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColorMap[color]}`} />
        </div>
      </div>

      <span className="text-xs font-semibold block mb-2 text-slate-700 dark:text-slate-200">
        {label}
      </span>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {unit}
          </span>
        )}
      </div>

      {statusBadge && (
        <StatusBadge status={statusBadge} className="text-xs" isDarkMode={isDarkMode} />
      )}

      {status && (
        <p className="text-xs mt-2 font-medium text-slate-600 dark:text-slate-300">
          {status}
        </p>
      )}
    </div>
  );
};

/**
 * EcosystemMonitoringCard - Premium Ecosystem Monitoring Dashboard Component
 * 
 * @param {Object} props
 * @param {number} props.vegetationIndex - NDVI value (0-1)
 * @param {number} props.biodiversityScore - Biodiversity score (0-100)
 * @param {number} props.forestCoverage - Forest coverage percentage (0-100)
 * @param {string} props.location - Location label
 * @param {number} props.lastUpdated - Minutes since last update
 * @param {boolean} props.isLoading - Loading state
 * @param {function} props.onMenuClick - Menu action handler
 * @param {Object} props.trends - Trend data
 */
const EcosystemMonitoringCard = ({
  vegetationIndex = null,
  biodiversityScore = null,
  forestCoverage = null,
  location = null,
  lastUpdated = null,
  isLoading = false,
  onMenuClick = () => {},
  trends = { vegetation: 0, biodiversity: 0, forest: 0 },
  trendDirections = { vegetation: 'up', biodiversity: 'up', forest: 'up' },
  isDarkMode = false,
  onHealthCalculated = () => {},
}) => {
  const [animated] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState({
    vegetationIndex,
    biodiversityScore,
    forestCoverage,
    locationLabel: null,
    lastUpdated,
  });
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const lastAutoFetchKeyRef = useRef(null);

  useEffect(() => {
    const lat = Number(location?.lat);
    const lon = Number(location?.lon);
    const fetchKey = `${lat.toFixed(6)},${lon.toFixed(6)}`;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    if (lastAutoFetchKeyRef.current === fetchKey) {
      return;
    }
    lastAutoFetchKeyRef.current = fetchKey;

    let cancelled = false;
    let timeoutId = null;

    const loadEcosystemMetrics = async () => {
      setIsLoadingLive(true);
      
      // Hard timeout: Force loading state to clear after 6 seconds
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.warn('⏱️ Ecosystem data fetch timeout - clearing loading state');
          setIsLoadingLive(false);
        }
      }, 6000);

      try {
        const liveData = await EcosystemAPI.get(lat, lon);
        if (cancelled) return;

        clearTimeout(timeoutId);
        const nowIso = new Date().toISOString();
        const timestamp = liveData?.timestamp || nowIso;
        const updatedAgoMins = Math.max(1, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));

        setLiveMetrics({
          vegetationIndex: Number.isFinite(Number(liveData?.vegetationIndex)) ? Number(liveData.vegetationIndex) : null,
          biodiversityScore: Number.isFinite(Number(liveData?.biodiversityScore)) ? Number(liveData.biodiversityScore) : null,
          forestCoverage: Number.isFinite(Number(liveData?.forestCoverage)) ? Number(liveData.forestCoverage) : null,
          locationLabel: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`,
          lastUpdated: Number.isFinite(updatedAgoMins) ? updatedAgoMins : 1,
        });
        setIsLoadingLive(false);
      } catch (error) {
        if (!cancelled) {
          clearTimeout(timeoutId);
          console.warn('Ecosystem live metrics unavailable, using fallback values.', error);
          setIsLoadingLive(false);
        }
      }
    };

    loadEcosystemMetrics();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [location?.lat, location?.lon]);

  const displayVegetationIndex = Number.isFinite(Number(liveMetrics.vegetationIndex)) ? Number(liveMetrics.vegetationIndex) : null;
  const displayBiodiversityScore = Number.isFinite(Number(liveMetrics.biodiversityScore)) ? Number(liveMetrics.biodiversityScore) : null;
  const displayForestCoverage = Number.isFinite(Number(liveMetrics.forestCoverage)) ? Number(liveMetrics.forestCoverage) : null;
  const displayLocation =
    liveMetrics.locationLabel ||
    (Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lon))
      ? `Lat ${Number(location.lat).toFixed(2)}, Lon ${Number(location.lon).toFixed(2)}`
      : 'Location unavailable');
  const displayLastUpdated = liveMetrics.lastUpdated;
  const actualLoading = isLoading || isLoadingLive;
  const hasLiveMetrics = [displayVegetationIndex, displayBiodiversityScore, displayForestCoverage].some((v) => Number.isFinite(v));

  // Compute vegetation status
  const getVegetationStatus = useMemo(() => {
    return () => {
      if (!Number.isFinite(displayVegetationIndex)) return { status: 'Unavailable', badge: 'moderate', info: 'Live vegetation metric unavailable' };
      if (displayVegetationIndex < 0.3) return { status: 'Low vegetation', badge: 'low', info: 'Area needs restoration' };
      if (displayVegetationIndex < 0.6) return { status: 'Moderate vegetation', badge: 'moderate', info: 'Fair ecosystem health' };
      return { status: 'High vegetation', badge: 'high', info: 'Thriving ecosystem' };
    };
  }, [displayVegetationIndex])();

  // Compute biodiversity status
  const getBiodiversityStatus = useMemo(() => {
    return () => {
      if (!Number.isFinite(displayBiodiversityScore)) return { status: 'Unavailable', badge: 'moderate', info: 'Live biodiversity metric unavailable' };
      if (displayBiodiversityScore < 40) return { status: 'Low diversity', badge: 'critical', info: 'Species loss detected' };
      if (displayBiodiversityScore < 70) return { status: 'Moderate diversity', badge: 'moderate', info: 'Some species decline' };
      return { status: 'High diversity', badge: 'healthy', info: 'Rich species composition' };
    };
  }, [displayBiodiversityScore])();

  // Compute forest status
  const getForestStatus = useMemo(() => {
    return () => {
      if (!Number.isFinite(displayForestCoverage)) return { status: 'Unavailable', badge: 'moderate', info: 'Live forest metric unavailable' };
      if (displayForestCoverage < 30) return { status: 'Low coverage', badge: 'low', info: 'Severe deforestation' };
      if (displayForestCoverage < 60) return { status: 'Moderate coverage', badge: 'moderate', info: 'Moderate tree density' };
      return { status: 'High coverage', badge: 'high', info: 'Healthy forest area' };
    };
  }, [displayForestCoverage])();

  const vegData = getVegetationStatus;
  const bioData = getBiodiversityStatus;
  const forestData = getForestStatus;

  if (actualLoading) {
    return (
      <div className={`rounded-2xl p-6 shadow-lg dark:shadow-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-emerald-200/50'}`}>
        <div className="space-y-4">
          <div className={`h-6 rounded w-1/3 animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-emerald-200'}`} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`h-40 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-emerald-100'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-2xl shadow-lg dark:shadow-xl
        hover:shadow-xl dark:hover:shadow-2xl backdrop-blur-sm
        overflow-hidden transition-all duration-300 ease-out hover:scale-[1.01] ${animated ? 'opacity-100' : 'opacity-0'} ${
          isDarkMode
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 hover:border-slate-600/80'
            : 'bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-200/60 hover:border-emerald-300/80'
        }
      `}
      style={{ animation: 'slideUp 0.5s ease-out' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Header */}
      <div className={`px-6 pt-6 pb-5 border-b ${isDarkMode ? 'border-slate-700/40' : 'border-slate-200/80'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-emerald-900/50' : 'bg-gradient-to-br from-emerald-100 to-teal-100'}`}>
                <Globe className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
              </div>
              <div>
                <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ecosystem Monitoring</h3>
                <p className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {displayLocation}
                  {Number.isFinite(Number(displayLastUpdated)) ? ` • Updated ${displayLastUpdated}m ago` : ''}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50' : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50/80'}`}
            aria-label="Ecosystem monitoring card options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Metrics Section */}
      <div className="px-6 py-6">
        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Vegetation Index */}
          <div className="flex justify-center">
            <CircularProgress
              value={Number.isFinite(displayVegetationIndex) ? displayVegetationIndex : 0}
              max={1}
              label="Vegetation Index (NDVI)"
              color="emerald"
            />
          </div>

          {/* Biodiversity Score */}
          <div className="flex justify-center">
            <CircularProgress
              value={Number.isFinite(displayBiodiversityScore) ? (displayBiodiversityScore / 100) : 0}
              max={1}
              label="Biodiversity Index"
              color="green"
            />
          </div>

          {/* Forest Coverage */}
          <div className="flex justify-center">
            <CircularProgress
              value={Number.isFinite(displayForestCoverage) ? (displayForestCoverage / 100) : 0}
              max={1}
              label="Forest Coverage"
              color="teal"
            />
          </div>
        </div>

        {/* Status Cards Section */}
        <div className={`border-t ${isDarkMode ? 'border-slate-700/40' : 'border-slate-200/80'} pt-6`}>
          <h4 className={`text-sm font-bold mb-4 flex items-center gap-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-100'}`}>
              <Activity className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
            </div>
            <span className="tracking-tight">Health Indicators</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Vegetation Status */}
            <div className={`rounded-xl p-5 border-2 backdrop-blur transition-all hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-emerald-900/20 border-emerald-700/50 hover:border-emerald-600/70' : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border-emerald-200/70 hover:border-emerald-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Vegetation
                </span>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-100'}`}>
                  <Leaf className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                </div>
              </div>
              <div className="mb-3">
                <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-emerald-100' : 'text-emerald-900'}`}>
                  {Number.isFinite(displayVegetationIndex) ? (displayVegetationIndex * 100).toFixed(0) : '--'}
                </span>
                <p className={`text-xs font-semibold mt-2 ${isDarkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>
                  {vegData.status}
                </p>
              </div>
              <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-emerald-300/80' : 'text-emerald-700/80'}`}>
                {vegData.info}
              </p>
              {trends.vegetation !== 0 && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg w-fit ${
                  trendDirections.vegetation === 'up'
                    ? isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                    : isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
                }`}>
                  {trendDirections.vegetation === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(trends.vegetation)}%</span>
                </div>
              )}
            </div>

            {/* Biodiversity Status */}
            <div className={`rounded-xl p-5 border-2 backdrop-blur transition-all hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-green-900/20 border-green-700/50 hover:border-green-600/70' : 'bg-gradient-to-br from-green-50/80 via-white to-emerald-50/40 border-green-200/70 hover:border-green-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                  Biodiversity
                </span>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
                  <Trees className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`} />
                </div>
              </div>
              <div className="mb-3">
                <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-green-100' : 'text-green-900'}`}>
                  {Number.isFinite(displayBiodiversityScore) ? displayBiodiversityScore : '--'}
                </span>
                <p className={`text-xs font-semibold mt-2 ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                  {bioData.status}
                </p>
              </div>
              <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-green-300/80' : 'text-green-700/80'}`}>
                {bioData.info}
              </p>
              {trends.biodiversity !== 0 && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg w-fit ${
                  trendDirections.biodiversity === 'up'
                    ? isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                    : isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
                }`}>
                  {trendDirections.biodiversity === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(trends.biodiversity)}%</span>
                </div>
              )}
            </div>

            {/* Forest Coverage Status */}
            <div className={`rounded-xl p-5 border-2 backdrop-blur transition-all hover:shadow-xl hover:-translate-y-1 ${isDarkMode ? 'bg-teal-900/20 border-teal-700/50 hover:border-teal-600/70' : 'bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 border-teal-200/70 hover:border-teal-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                  Forest Cover
                </span>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-teal-900/40' : 'bg-teal-100'}`}>
                  <Target className={`w-4 h-4 ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`} />
                </div>
              </div>
              <div className="mb-3">
                <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-teal-100' : 'text-teal-900'}`}>
                  {Number.isFinite(displayForestCoverage) ? `${displayForestCoverage}%` : '--'}
                </span>
                <p className={`text-xs font-semibold mt-2 ${isDarkMode ? 'text-teal-200' : 'text-teal-800'}`}>
                  {forestData.status}
                </p>
              </div>
              <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-teal-300/80' : 'text-teal-700/80'}`}>
                {forestData.info}
              </p>
              {trends.forest !== 0 && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg w-fit ${
                  trendDirections.forest === 'up'
                    ? isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                    : isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
                }`}>
                  {trendDirections.forest === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(trends.forest)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overall Health Indicator */}
        <div className={`mt-7 pt-7 border-t ${isDarkMode ? 'border-slate-700/40' : 'border-slate-200/80'}`}>
          <EcosystemHealthCalculate
            location={location}
            isDarkMode={isDarkMode}
            onHealthCalculated={onHealthCalculated}
          />
        </div>
      </div>

      {/* Footer */}
      <div className={`px-6 py-5 border-t ${isDarkMode ? 'bg-slate-800/40 border-slate-700/40' : 'bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40 border-slate-200/80'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Monitoring Status</span>
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full animate-pulse ${hasLiveMetrics ? (isDarkMode ? 'bg-emerald-400/80' : 'bg-emerald-600') : (isDarkMode ? 'bg-amber-400/80' : 'bg-amber-600')}`} />
            <span className={`text-sm font-bold ${hasLiveMetrics ? (isDarkMode ? 'text-emerald-300' : 'text-emerald-700') : (isDarkMode ? 'text-amber-300' : 'text-amber-700')}`}>{hasLiveMetrics ? 'Live' : 'Partial / Unavailable'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcosystemMonitoringCard;
