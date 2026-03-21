import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sun, Zap, MoreHorizontal, RefreshCw } from 'lucide-react';
import { UVAPI } from '../api';

/**
 * UV Severity Categories
 */
const UV_SEVERITY = {
  LOW: { min: 0, max: 2, label: 'Low', color: 'from-green-400 to-emerald-500', textColor: 'text-green-700', bg: 'bg-green-50' },
  MODERATE: { min: 3, max: 5, label: 'Moderate', color: 'from-yellow-400 to-yellow-500', textColor: 'text-yellow-700', bg: 'bg-yellow-50' },
  HIGH: { min: 6, max: 7, label: 'High', color: 'from-orange-400 to-orange-500', textColor: 'text-orange-700', bg: 'bg-orange-50' },
  VERY_HIGH: { min: 8, max: 10, label: 'Very High', color: 'from-red-500 to-red-600', textColor: 'text-red-700', bg: 'bg-red-50' },
  EXTREME: { min: 11, max: Infinity, label: 'Extreme', color: 'from-purple-600 to-violet-700', textColor: 'text-purple-700', bg: 'bg-purple-50' },
};

/**
 * Get UV severity category based on index value
 */
const getUvSeverity = (value) => {
  for (const [key, data] of Object.entries(UV_SEVERITY)) {
    if (value >= data.min && value <= data.max) {
      return { key, ...data };
    }
  }
  return UV_SEVERITY.EXTREME;
};

/**
 * CompactSunIllustration - Optimized sun visualization for compact layout
 */
const CompactSunIllustration = ({ severity }) => (
  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
    {/* Background glow - subtle */}
    <div className={`absolute inset-0 rounded-full opacity-15 blur-md bg-gradient-to-r ${severity.color}`}></div>

    {/* Sun circle - optimized size */}
    <div className={`absolute w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r ${severity.color} shadow-lg`}>
      {/* Inner sun highlight */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="30" fill="white" opacity="0.85" />
      </svg>
    </div>

    {/* Minimal decorative rays */}
    <div className="absolute inset-0">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-2 bg-gradient-to-b from-amber-300 to-transparent rounded-full"
          style={{
            top: '0px',
            left: '50%',
            transform: `translateX(-50%) rotate(${i * 90}deg)`,
            opacity: 0.4,
          }}
        ></div>
      ))}
    </div>
  </div>
);

/**
 * CompactInfoRow - Optimized detail component for compact layout
 */
// eslint-disable-next-line no-unused-vars
const CompactInfoRow = ({ icon: Icon, label, value, isDarkMode, unit = '', isAnimating = false }) => (
  <div className={`flex items-center justify-between gap-1.5 sm:gap-2 p-1 sm:p-1.5 md:p-2 rounded-lg transition-all duration-300 ${
    isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-blue-50/50'
  }`}>
    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} aria-hidden="true" />
      <span className={`text-xs sm:text-sm font-medium truncate ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-0.5 sm:gap-1 flex-shrink-0">
      <span className={`font-semibold text-xs sm:text-sm transition-all duration-300 ${
        isAnimating ? 'scale-110' : 'scale-100'
      } ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </span>
      {unit && (
        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

/**
 * UvCard - Professional UV & Radiation component (Premium Design)
 * 
 * Compact, elegant card with:
 * - UV index visualization
 * - Real-time radiation monitoring
 * - Health protection guidance
 * - Dark mode support
 * - Senior-level UI design
 */
const UvCard = ({
  isDarkMode = false,
  location = null,
  uvIndex = 8,
  sunlightHours = 10,
  radiationValue = 165,
  isLoading = false,
  onRefresh = () => {},
  showMenu = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUvIndex, setCurrentUvIndex] = useState(uvIndex);
  const [currentSunlightHours, setCurrentSunlightHours] = useState(sunlightHours);
  const [currentRadiation, setCurrentRadiation] = useState(radiationValue);
  const [apiLoading, setApiLoading] = useState(false);
  const [animatingField, setAnimatingField] = useState(null);
  const menuRef = useRef(null);
  const lastAutoFetchKeyRef = useRef(null);

  // Fetch UV data when location changes
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

    const fetchUvData = async () => {
      setApiLoading(true);
      try {
        const data = await UVAPI.get(lat, lon);
        
        // Validate we got valid data and it's different from current values
        if (data && typeof data.uvi === 'number' && typeof data.sunlightHours === 'number' && typeof data.radiationValue === 'number') {
          setCurrentUvIndex(data.uvi);
          setCurrentSunlightHours(data.sunlightHours);
          setCurrentRadiation(data.radiationValue);
        } else {
          console.warn('⚠️ UvCard: Invalid data received from API:', data);
        }
      } catch (error) {
        console.error('❌ UvCard: Failed to fetch UV data:', error);
        console.error('❌ Error details:', { message: error.message, stack: error.stack });
        // Keep previous values as fallback
      } finally {
        setApiLoading(false);
      }
    };

    fetchUvData();
  }, [location?.lat, location?.lon]);

  const severity = useMemo(() => getUvSeverity(currentUvIndex), [currentUvIndex]);

  // Animate on data updates - only animate the main UV value
  useEffect(() => {
    setAnimatingField('uvi');
    const timer = setTimeout(() => setAnimatingField(null), 300);
    return () => clearTimeout(timer);
  }, [currentUvIndex, currentSunlightHours, currentRadiation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (location && location.lat && location.lon) {
      try {
        const data = await UVAPI.get(location.lat, location.lon, { force: true });
        if (data) {
          setCurrentUvIndex(data.uvi || currentUvIndex);
          setCurrentSunlightHours(data.sunlightHours || currentSunlightHours);
          setCurrentRadiation(data.radiationValue || currentRadiation);
        }
      } catch (error) {
        console.error('❌ UvCard: Failed to refresh UV data:', error);
      }
    } else {
      console.warn('⚠️ UvCard: No location available for refresh:', location);
    }
    try {
      await onRefresh?.();
    } catch (e) {
      console.error('❌ UvCard: onRefresh callback error:', e);
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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
      }`} role="status" aria-label="Loading UV information" aria-busy="true">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
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
      aria-label="UV index and radiation information"
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
      <div className="flex items-center justify-between flex-shrink-0 px-2 sm:px-4 md:px-6 pt-2.5 sm:pt-3 md:pt-3.5 pb-1.5 sm:pb-2">
        <h3 className={`font-bold text-xs sm:text-base md:text-lg truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          UV & Radiation
        </h3>

        {showMenu && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsMenuOpen(false);
                if (e.key === 'Enter') setIsMenuOpen(!isMenuOpen);
              }}
              className={`p-1 sm:p-2 rounded-lg transition-all duration-300 touch-manipulation active:scale-95 ${
                isDarkMode
                  ? 'hover:bg-slate-700/60 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-blue-100/50 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="UV card menu"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <MoreHorizontal className={`w-5 h-5 transition-transform duration-300 ${isMenuOpen ? 'scale-125' : 'hover:scale-110'}`} aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div className={`absolute right-0 mt-2 w-36 sm:w-44 md:w-48 rounded-lg shadow-2xl overflow-hidden z-50 transition-all duration-200 menu-enter backdrop-blur-md ${
                isDarkMode
                  ? 'bg-slate-700/95 border border-slate-600/70'
                  : 'bg-white/95 border border-gray-200/70'
              }`} role="menu">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRefresh();
                    setIsMenuOpen(false);
                  }}
                  className={`w-full enabled:cursor-pointer text-left px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all flex items-center gap-2 font-medium border-b touch-manipulation active:bg-slate-600/30 ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-slate-600/50 border-slate-600/30'
                      : 'text-gray-700 hover:bg-blue-50/70 border-gray-100/50'
                  }`}
                  role="menuitem"
                  aria-label="Refresh UV data"
                  type="button"
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
      <div className="flex-1 flex flex-col px-2 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-3.5 gap-1 sm:gap-1.5 md:gap-2.5">
        {/* Main UV Index Display */}
        <div className={`rounded-xl p-1.5 sm:p-2 md:p-2.5 bg-gradient-to-r ${severity.color} shadow-md transition-all duration-300 flex items-center gap-1.5 sm:gap-2 md:gap-2.5 flex-shrink-0`}>
          {/* Left: UV Value & Label */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80">UV Index</p>
            <p className={`text-lg sm:text-2xl md:text-3xl font-bold text-white mt-0 leading-tight transition-all duration-300 ${
              animatingField === 'uvi' ? 'scale-110' : 'scale-100'
            }`}>{Math.round(currentUvIndex * 10) / 10}</p>
            <div className="mt-0.5">
              <span className="inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full truncate max-w-xs">
                {severity.label}
              </span>
            </div>
          </div>

          {/* Right: Sun Illustration */}
          <CompactSunIllustration severity={severity} />
        </div>

        {/* Protection Guidance */}
        <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg border-l-4 transition-all flex-shrink-0 ${
          isDarkMode
            ? 'bg-slate-700/50 border-amber-400'
            : 'bg-amber-50 border-amber-400'
        }`}>
          <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-amber-200' : 'text-amber-800'} line-clamp-2`}>
            {currentUvIndex >= 8
              ? 'High UV risk. Use SPF 50+ and protective clothing.'
              : currentUvIndex >= 6
              ? 'Moderate UV. SPF 30+ recommended during peak hours.'
              : 'Low UV risk. Standard sunscreen sufficient.'}
          </p>
        </div>
      </div>

      {/* Details Section */}
      <div className={`flex-shrink-0 space-y-0.5 sm:space-y-1.5 md:space-y-2.5 px-2 sm:px-4 md:px-6 py-1.5 sm:py-3 md:py-4.5 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-gray-100'}`}>
        <CompactInfoRow
          icon={Sun}
          label="Sunlight"
          value={Math.round(currentSunlightHours * 10) / 10}
          unit="hrs"
          isDarkMode={isDarkMode}
          isAnimating={false}
        />
        <CompactInfoRow
          icon={Zap}
          label="Radiation"
          value={currentRadiation}
          unit="W/m²"
          isDarkMode={isDarkMode}
          isAnimating={false}
        />
      </div>

      {/* Footer Section */}
      <div className={`flex-shrink-0 text-xs text-center px-2 sm:px-4 md:px-6 pb-2.5 sm:pb-3 md:pb-4 pt-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Real-time monitoring
      </div>
    </div>
  );
};

UvCard.defaultProps = {
  isDarkMode: false,
  uvIndex: 8,
  sunlightHours: 10,
  radiationValue: 165,
  isLoading: false,
  onRefresh: () => {},
  showMenu: true,
};

export default UvCard;
