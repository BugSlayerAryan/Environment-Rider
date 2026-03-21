import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MoreHorizontal, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';
import { AQIAPI } from '../api';

/**
 * AQI Category Mapping and Professional Color Scheme
 * Based on EPA Air Quality Index standards
 */
const AQI_CATEGORIES = {
  GOOD: { 
    min: 0, 
    max: 50, 
    label: 'Good', 
    color: 'from-green-400 to-green-600', 
    textColor: 'text-green-700', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  MODERATE: { 
    min: 51, 
    max: 100, 
    label: 'Moderate', 
    color: 'from-yellow-400 to-yellow-600', 
    textColor: 'text-yellow-700', 
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  CAUTION: { 
    min: 101, 
    max: 150, 
    label: 'Unhealthy', 
    color: 'from-orange-400 to-orange-600', 
    textColor: 'text-orange-700', 
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  UNHEALTHY: { 
    min: 151, 
    max: 200, 
    label: 'Unhealthy', 
    color: 'from-red-500 to-red-700', 
    textColor: 'text-red-700', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  SEVERE: { 
    min: 201, 
    max: 300, 
    label: 'Very Unhealthy', 
    color: 'from-purple-500 to-purple-700', 
    textColor: 'text-purple-700', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  HAZARDOUS: { 
    min: 301, 
    max: Infinity, 
    label: 'Hazardous', 
    color: 'from-red-900 to-red-950', 
    textColor: 'text-red-900', 
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300'
  },
};

/**
 * Health advice based on AQI category
 * Provides actionable guidance for users
 */
const HEALTH_ADVICE = {
  GOOD: '✓ Perfect day! Air quality is excellent. Enjoy all outdoor activities freely.',
  MODERATE: '⚠️ Air quality is acceptable for most. Sensitive groups should consider limiting intense outdoor activity.',
  CAUTION: '🔴 Air quality is degrading. Sensitive groups (children, elderly, asthma) should avoid prolonged outdoor activity.',
  UNHEALTHY: '⛔ CAUTION: Everyone may experience health effects. Limit outdoor activity significantly. Keep windows closed.',
  SEVERE: '🚨 HIGH ALERT: Serious health effects expected. Avoid outdoor activity. Use air purifiers and wear N95 masks indoors.',
  HAZARDOUS: '🆘 EMERGENCY: Hazardous air quality. Remain indoors. Avoid all outdoor activity. Use air purifiers with N95 masks.',
};

/**
 * Get AQI category and data based on value
 * @param {number} value - AQI value (0-500+)
 * @returns {object} Category data with styling and information
 */
const getAqiCategory = (value) => {
  for (const [key, data] of Object.entries(AQI_CATEGORIES)) {
    if (value >= data.min && value <= data.max) {
      return { key, ...data };
    }
  }
  return AQI_CATEGORIES.HAZARDOUS;
};

/**
 * MiniSparkline - Compact trend visualization
 * Shows AQI trend over time with mini line chart
 */
const MiniSparkline = ({ data, isDarkMode }) => {
  if (!data || data.length < 2) return null;
  
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  
  // Create SVG path for sparkline
  const width = 120;
  const height = 32;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * chartWidth + padding;
    const y = chartHeight - ((value - minValue) / range) * chartHeight + padding;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="inline-flex items-center gap-1.5 sm:gap-2 md:gap-2.5">
      <svg width={width} height={height} className="flex-shrink-0" aria-hidden="true">
        <polyline
          points={points}
          fill="none"
          stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={points}
          fill={isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'}
          fillOpacity="0.3"
          stroke="none"
        />
      </svg>
      <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Last 7 days
      </span>
    </div>
  );
};

/**
 * CompactAqiGauge - Elegant compact gauge visualization
 */
const CompactAqiGauge = ({ aqiValue, isDarkMode }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const category = useMemo(() => getAqiCategory(aqiValue), [aqiValue]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(aqiValue), 50);
    return () => clearTimeout(timer);
  }, [aqiValue]);

  // Calculate rotation: 0 = 0°, 300 = 180°
  const rotation = (animatedValue / 300) * 180;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
      {/* Compact Gauge - 28% smaller */}
      <div className="relative w-20 h-12 sm:w-24 sm:h-14 md:w-28 md:h-16 lg:w-32 lg:h-20 flex-shrink-0">
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="25%" stopColor="#eab308" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="75%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          
          {/* Gauge arc background */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={isDarkMode ? '#334155' : '#e2e8f0'}
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Gauge arc gradient */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${((animatedValue / 300) * 251.33)} 251.33`}
            style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
          />

          {/* Needle */}
          <g transform={`translate(100, 100) rotate(${rotation - 90})`} style={{ transition: 'transform 0.8s ease-out' }}>
            <line x1="0" y1="0" x2="0" y2="-70" stroke={isDarkMode ? '#fff' : '#1e293b'} strokeWidth="3" strokeLinecap="round" />
            <circle cx="0" cy="0" r="5" fill={isDarkMode ? '#fff' : '#1e293b'} />
          </g>

          {/* Center indicator */}
          <circle cx="100" cy="100" r="3" fill={isDarkMode ? '#94a3b8' : '#64748b'} />
        </svg>
      </div>

      {/* AQI Value & Category - Right Side */}
      <div className="flex-1 flex flex-col justify-start gap-0 sm:gap-0.5">
        <div className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight ${category.textColor}`}>
          {Math.round(animatedValue)}
        </div>
        <div className={`inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r ${category.color} w-fit max-w-xs truncate`}>
          {category.label}
        </div>
      </div>
    </div>
  );
};

/**
 * PollutantItem - Reusable sub-component for pollutant details
 */
const PollutantItem = ({ label, value, unit, colorClass, isDarkMode, trend = null, isAlert = false }) => (
  <div className={`flex items-center justify-between gap-2 sm:gap-3 p-1 sm:p-2 md:p-3 rounded-lg transition-all duration-300 ${
    isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-blue-50/50'
  }`}>
    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${colorClass}`}></div>
      <span className={`text-xs sm:text-sm font-medium truncate ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
      <span className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </span>
      <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
        {unit}
      </span>
      {trend && (
        <div className={`flex items-center gap-0.5 text-xs ml-0.5 ${trend.direction === 'up' ? 'text-red-500' : 'text-green-500'}`}>
          {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </div>
      )}
      {isAlert && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
    </div>
  </div>
);

/**
 * AqiCard - Professional Air Quality Index component (Premium Design)
 * 
 * Elegant, compact card with:
 * - Compact gauge visualization
 * - Real-time pollutant monitoring
 * - Health status indicator
 * - Dark mode support
 * - Smooth animations
 * - Senior-level UI design
 */
const AqiCard = ({
  isDarkMode = false,
  location = null,
  aqiValue = 165,
  pm25 = 85,
  pm10 = 120,
  pm25Trend = null,
  pm10Trend = null,
  isLoading = false,
  showMenu = true,
  onRefresh = () => {},
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentAqiValue, setCurrentAqiValue] = useState(aqiValue);
  const [currentPm25, setCurrentPm25] = useState(pm25);
  const [currentPm10, setCurrentPm10] = useState(pm10);
  const [apiLoading, setApiLoading] = useState(false);
  const [animatingField, setAnimatingField] = useState(null);
  const menuRef = useRef(null);
  const lastAutoFetchKeyRef = useRef(null);

  // Fetch AQI data when location changes
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

    const fetchAqiData = async () => {
      setApiLoading(true);
      try {
        const data = await AQIAPI.get(lat, lon);
        setCurrentAqiValue(data.aqi || aqiValue);
        setCurrentPm25(data.pm25 || pm25);
        setCurrentPm10(data.pm10 || pm10);
      } catch (error) {
        console.error('❌ Failed to fetch AQI data:', error);
        // Keep previous values as fallback
      } finally {
        setApiLoading(false);
      }
    };

    fetchAqiData();
  }, [location?.lat, location?.lon, aqiValue, pm25, pm10]);

  const category = useMemo(() => getAqiCategory(currentAqiValue), [currentAqiValue]);
  const healthAdvice = useMemo(() => HEALTH_ADVICE[category.key], [category.key]);

  // Animate on data updates
  useEffect(() => {
    setAnimatingField('aqi');
    const timer = setTimeout(() => setAnimatingField(null), 300);
    return () => clearTimeout(timer);
  }, [currentAqiValue, currentPm25, currentPm10]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (location && location.lat && location.lon) {
      try {
        const data = await AQIAPI.get(location.lat, location.lon, { force: true });
        setCurrentAqiValue(data.aqi || currentAqiValue);
        setCurrentPm25(data.pm25 || currentPm25);
        setCurrentPm10(data.pm10 || currentPm10);
      } catch (error) {
        console.error('Failed to refresh AQI data:', error);
      }
    }
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [location, currentAqiValue, currentPm25, currentPm10, onRefresh]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Skeleton loading state (initial load OR during refresh)
  if (isLoading || apiLoading || isRefreshing) {
    return (
      <div className={`rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg transition-all duration-300 ${
        isDarkMode
          ? 'bg-slate-800 border border-slate-700'
          : 'bg-white border border-gray-100'
      }`} role="status" aria-label="Loading air quality information" aria-busy="true">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-6"></div>
          </div>
          <div className="h-14 sm:h-16 md:h-20 bg-gray-300 dark:bg-gray-600 rounded-lg w-full"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 hover:border-slate-600/80 backdrop-blur-sm'
          : 'bg-gradient-to-br from-white to-slate-50/50 border border-gray-200/70 hover:border-gray-300/90 backdrop-blur-sm'
      }`}
      style={{ animation: 'slideUp 0.5s ease-out' }}
      role="region"
      aria-label="Air quality index information"
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

      {/* Header Section */}
      <div className="flex items-center justify-between flex-shrink-0 px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-8 pb-0.5">
        <h3 className={`font-bold text-xs sm:text-base md:text-lg truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Air Quality
        </h3>

        {showMenu && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsMenuOpen(false);
                if (e.key === 'Enter') setIsMenuOpen(!isMenuOpen);
              }}
              className={`p-1 sm:p-2 rounded-lg transition-all duration-300 group touch-manipulation active:scale-95 ${
                isDarkMode
                  ? 'hover:bg-slate-700/60 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-blue-100/50 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Air quality menu options"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="w-5 h-5 transition-transform group-hover:scale-110" aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div className={`absolute right-0 mt-2 w-36 sm:w-44 md:w-48 rounded-lg shadow-2xl overflow-hidden z-50 transition-all duration-200 menu-enter backdrop-blur-md ${
                isDarkMode
                  ? 'bg-slate-700/95 border border-slate-600/70'
                  : 'bg-white/95 border border-gray-200/70'
              }`} role="menu">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all flex items-center gap-2 font-medium border-b touch-manipulation active:bg-slate-600/30 ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-slate-600/50 border-slate-600/30'
                      : 'text-gray-700 hover:bg-blue-50/70 border-gray-100/50'
                  }`}
                  role="menuitem"
                  aria-label="Refresh air quality data"
                >
                  <RefreshCw className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    isRefreshing ? 'animate-spin' : ''
                  }`} aria-hidden="true" />
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <div className="flex-1 flex flex-col px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-3.5 gap-1.5 sm:gap-2 md:gap-2.5 border-b-0">
        {/* Main Gauge Section */}
        <div className={`flex-shrink-0 overflow-x-auto transition-all duration-300 ${animatingField === 'aqi' ? 'scale-105' : 'scale-100'}`}>
          <CompactAqiGauge aqiValue={currentAqiValue} isDarkMode={isDarkMode} />
        </div>

        {/* Health Status Badge */}
        <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg border-l-4 transition-all flex-shrink-0 ${
          isDarkMode
            ? 'bg-slate-700/50 border-' + category.textColor.replace('text-', '')
            : category.bgColor + ' border-' + category.textColor.replace('text-', '')
        }`}>
          <p className={`text-xs sm:text-sm md:text-sm font-medium ${category.textColor} line-clamp-3 sm:line-clamp-2`}>
            {healthAdvice}
          </p>
        </div>
      </div>

      {/* Details Section */}
      <div className={`flex-shrink-0 space-y-0.5 sm:space-y-1 md:space-y-1.5 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2.5 md:py-3.5`}>
        <PollutantItem
          label="PM2.5"
          value={currentPm25}
          unit="µg/m³"
          colorClass="bg-red-500"
          isDarkMode={isDarkMode}
          trend={pm25Trend}
          isAlert={currentPm25 > 150}
        />
        <PollutantItem
          label="PM10"
          value={currentPm10}
          unit="µg/m³"
          colorClass="bg-orange-500"
          isDarkMode={isDarkMode}
          trend={pm10Trend}
          isAlert={currentPm10 > 200}
        />
      </div>

      {/* Footer Section */}
      <div className={`flex-shrink-0 text-xs text-center px-2 sm:px-4 md:px-6 pb-2 sm:pb-2.5 md:pb-3 pt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Real-time monitoring
      </div>
    </div>
  );
};

AqiCard.defaultProps = {
  isDarkMode: false,
  aqiValue: 165,
  pm25: 85,
  pm10: 120,
  pm25Trend: null,
  pm10Trend: null,
  isLoading: false,
  showMenu: true,
  onRefresh: () => {},
};

export default AqiCard;