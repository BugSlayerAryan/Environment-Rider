import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Sun, Cloud, CloudRain, Droplets, Wind, MoreHorizontal, RefreshCw, AlertCircle } from 'lucide-react';
import { WeatherAPI } from '../api';

/**
 * WeatherDetailItem - Reusable sub-component for weather detail rows
 * Displays icon, label, and animated value with smooth transitions
 * 
 * Props:
 * - icon: Lucide React icon component
 * - label: Display label (string)
 * - value: Current value/measurement
 * - isDarkMode: Boolean for theme adaptation
 * - isAnimating: Optional animation state
 */
// eslint-disable-next-line no-unused-vars
const WeatherDetailItem = ({ icon: Icon, label, value, isDarkMode, isAnimating = false }) => (
  <div className={`flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm transition-all duration-300 px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-lg ${
    isAnimating ? 'scale-105' : 'scale-100'
  } ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-blue-50/50'}`}>
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-colors ${
        isDarkMode ? 'text-blue-400' : 'text-blue-500'
      }`} aria-hidden="true" />
      <span className={`font-medium text-xs sm:text-sm truncate ${
        isDarkMode ? 'text-gray-300' : 'text-slate-600'
      }`}>
        {label}
      </span>
    </div>
    <span className={`font-semibold text-xs sm:text-sm whitespace-nowrap ml-2 flex-shrink-0 ${
      isDarkMode ? 'text-white' : 'text-slate-900'
    }`}>
      {value}
    </span>
  </div>
);

/**
 * WeatherIcon - Animated weather condition icon display
 * Displays layered sun/cloud icons with smooth animations
 */
const WeatherIcon = ({ isRefreshing, isDarkMode }) => (
  <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center flex-shrink-0">
    {/* Premium gradient background glow */}
    <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${
      isDarkMode ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gradient-to-br from-amber-300 to-orange-300'
    }`} />
    
    {/* Main sun icon with enhanced styling */}
    <Sun
      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-amber-400 transition-transform drop-shadow-lg ${
        isRefreshing ? 'animate-spin-slow' : ''
      }`}
      aria-hidden="true"
      strokeWidth={1.5}
    />
    
    {/* Overlay cloud with better positioning */}
    <Cloud
      className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 absolute bottom-0 right-0 ${
        isDarkMode ? 'text-slate-400' : 'text-gray-300'
      } transition-colors drop-shadow`}
      aria-hidden="true"
      strokeWidth={1.5}
    />
  </div>
);

/**
 * WeatherCard - Professional environmental weather display component
 * 
 * A production-ready weather card with:
 * - Real-time API data integration (OpenWeatherMap)
 * - Responsive design (mobile-first)
 * - Dark mode support
 * - Temperature unit toggle (°C / °F)
 * - Skeleton loading state
 * - Error state handling
 * - Smooth animations and transitions
 * - Full accessibility (ARIA labels, semantic HTML)
 * - Micro-interactions (hover, scale, shadows)
 * 
 * Props:
 * - isDarkMode: Boolean for theme (default: false)
 * - latitude: Latitude for weather data (default: 28.6139 - New Delhi)
 * - longitude: Longitude for weather data (default: 77.2090 - New Delhi)
 * - temperature: Override temperature in Celsius (for demo purposes)
 * - condition: Override weather condition text
 * - time: Override time display
 * - humidity: Override humidity percentage
 * - wind: Override wind speed & direction
 * - rainProbability: Override rain chance percentage
 * - isLoading: Override loading state
 * - hasError: Override error state
 * - onRefresh: Refresh callback function
 * - showMenuOptions: Show menu button (default: true)
 */
const WeatherCard = ({
  isDarkMode = false,
  latitude = 28.6139, // New Delhi default
  longitude = 77.2090,
  temperature: propTemperature,
  condition: propCondition,
  time: propTime,
  humidity: propHumidity,
  wind: propWind,
  rainProbability: propRainProbability,
  isLoading: propIsLoading,
  hasError: propHasError,
  onRefresh: propOnRefresh = () => {},
  showMenuOptions = true,
}) => {
  // State for API data
  const [apiData, setApiData] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // State for UI
  const [unitCelsius, setUnitCelsius] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatingField, setAnimatingField] = useState(null);
  const menuRef = useRef(null);

  // Determine which data to use (prop override or API data)
  const temperature = propTemperature !== undefined ? propTemperature : (apiData?.temp ?? 29);
  const condition = propCondition !== undefined ? propCondition : (apiData?.condition ?? 'Partly Cloudy');
  const humidity = propHumidity !== undefined ? propHumidity : (apiData?.humidity ?? 58);
  const wind = propWind !== undefined ? propWind : (apiData?.windFormatted ?? '12 km/h NW');
  const rainProbability = propRainProbability !== undefined ? propRainProbability : (apiData?.rainProbability ?? 20);
  const isLoading = propIsLoading !== undefined ? propIsLoading : isLoadingApi;
  const hasError = propHasError !== undefined ? propHasError : apiError;

  // Helper function to get wind direction from degrees
  const getWindDirection = (degrees) => {
    if (!degrees && degrees !== 0) return '';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Fetch weather data from API
  const fetchWeatherData = useCallback(async () => {
    setIsLoadingApi(true);
    setApiError(false);
    try {
      const data = await WeatherAPI.get(latitude, longitude);
      
      // Convert wind speed from m/s to km/h
      const windSpeedKmh = Math.round(data.wind * 3.6);
      const windDirection = getWindDirection(data.windDeg || 0);
      const windFormatted = windDirection 
        ? `${windSpeedKmh} km/h ${windDirection}`
        : `${windSpeedKmh} km/h`;
      
      setApiData({
        temp: data.temp,
        condition: data.condition,
        humidity: data.humidity,
        windFormatted,
        rainProbability: 0, // Free API doesn't provide rain probability, fallback to 0
        ...data // Keep raw data for debugging
      });
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      setApiError(true);
    } finally {
      setIsLoadingApi(false);
    }
  }, [latitude, longitude]);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setCurrentTime(`On ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch weather data on mount and when location changes
  useEffect(() => {
    if (propTemperature === undefined && propCondition === undefined) {
      // Only fetch if not using prop overrides
      fetchWeatherData();
    }
  }, [latitude, longitude, fetchWeatherData, propTemperature, propCondition]);

  // Convert temperature based on unit - memoized
  const displayTemp = useMemo(() => {
    if (unitCelsius) return `${Math.round(temperature)}°C`;
    return `${Math.round((temperature * 9/5) + 32)}°F`;
  }, [temperature, unitCelsius]);

  // Handle refresh with proper error handling
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await WeatherAPI.get(latitude, longitude, { force: true });
      
      const windSpeedKmh = Math.round(data.wind * 3.6);
      const windDirection = getWindDirection(data.windDeg || 0);
      const windFormatted = windDirection
        ? `${windSpeedKmh} km/h ${windDirection}`
        : `${windSpeedKmh} km/h`;

      setApiData({
        temp: data.temp,
        condition: data.condition,
        humidity: data.humidity,
        windFormatted,
        rainProbability: 0,
        ...data,
      });
      await propOnRefresh();
    } catch (error) {
      console.error('Weather refresh failed:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [latitude, longitude, propOnRefresh]);

  // Animate on data updates
  useEffect(() => {
    setAnimatingField('temperature');
    const timer = setTimeout(() => setAnimatingField(null), 300);
    return () => clearTimeout(timer);
  }, [temperature, humidity, rainProbability]);

  // Menu toggle with keyboard support
  const toggleMenu = useCallback(() => {
    setShowMenu(prev => !prev);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Use prop override time or dynamically computed time
  const displayTime = propTime || currentTime || 'Loading...';

  // Skeleton loading state
  if (isLoading) {
    return (
      <div 
        className={`rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg transition-all duration-300 ${
          isDarkMode
            ? 'bg-slate-800 border border-slate-700'
            : 'bg-white border border-gray-100'
        }`} 
        role="status" 
        aria-label="Loading weather information"
        aria-busy="true"
      >
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-6"></div>
          </div>
          <div className="h-16 sm:h-20 md:h-24 bg-gray-300 dark:bg-gray-600 rounded-lg w-full"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry button
  if (hasError) {
    return (
      <div 
        className={`rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border ${
          isDarkMode
            ? 'bg-red-900/20 border-red-800 text-red-200'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
        role="alert"
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 text-sm sm:text-base">Unable to load weather</h3>
            <p className="text-xs sm:text-sm opacity-90">Please try refreshing the data.</p>
            <button
              onClick={handleRefresh}
              className={`mt-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-red-800/50 hover:bg-red-800'
                  : 'bg-red-100 hover:bg-red-200'
              }`}
              aria-label="Retry loading weather information"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-slate-600/60 backdrop-blur-sm'
          : 'bg-gradient-to-br from-white to-blue-50/30 border border-gray-200/60 hover:border-gray-300/80 backdrop-blur-sm'
      }`}
      style={{
        animation: 'slideUp 0.5s ease-out'
      }}
      role="region"
      aria-label="Weather information"
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .menu-enter {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>

      {/* Header Section with enhanced styling */}
      <div className={`flex items-center justify-between flex-shrink-0 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-5 pb-2 sm:pb-3 md:pb-4 border-b ${
        isDarkMode ? 'border-slate-700/30' : 'border-gray-200/40'
      }`}>
        <h3 className={`font-bold text-sm sm:text-base md:text-lg lg:text-xl tracking-tight truncate ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          Weather
        </h3>

        {/* Premium Menu Button with enhanced interactions */}
        {showMenuOptions && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowMenu(false);
                if (e.key === 'Enter') toggleMenu();
              }}
              className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 group touch-manipulation active:scale-95 ${
                isDarkMode
                  ? 'hover:bg-slate-700/60 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-blue-100/60 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Weather options menu"
              aria-expanded={showMenu}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="w-5 h-5 transition-transform group-hover:scale-110" aria-hidden="true" />
            </button>

            {showMenu && (
              <div
                className={`absolute right-0 mt-2 w-44 sm:w-48 md:w-56 rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-200 menu-enter backdrop-blur-sm ${
                    isDarkMode
                    ? 'bg-slate-700/95 border border-slate-600/60 divide-slate-600/40'
                    : 'bg-white/95 border border-gray-300/60 divide-gray-100/80'
                } divide-y`}
                role="menu"
              >
                {/* Refresh Option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm transition-all flex items-center gap-2 sm:gap-3 font-medium hover:translate-x-0.5 touch-manipulation active:bg-slate-600/30 ${
                    isDarkMode
                      ? 'text-gray-200 hover:bg-slate-600/70'
                      : 'text-gray-700 hover:bg-blue-50/80'
                  }`}
                  role="menuitem"
                  aria-label="Refresh weather data"
                >
                  <RefreshCw className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    isRefreshing ? 'animate-spin-slow' : 'group-hover:rotate-180'
                  }`} aria-hidden="true" />
                  <span>Refresh Data</span>
                </button>

                {/* Temperature Unit Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnitCelsius(!unitCelsius);
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm transition-all flex items-center gap-2 sm:gap-3 font-medium hover:translate-x-0.5 touch-manipulation active:bg-slate-600/30 ${
                    isDarkMode
                      ? 'text-gray-200 hover:bg-slate-600/70'
                      : 'text-gray-700 hover:bg-blue-50/80'
                  }`}
                  role="menuitem"
                  aria-label={`Switch to ${unitCelsius ? 'Fahrenheit' : 'Celsius'}`}
                >
                  <div className={`w-4 h-4 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isDarkMode ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-200/60 text-amber-700'
                  }`}>
                    {unitCelsius ? 'F' : 'C'}
                  </div>
                  <span>{unitCelsius ? 'Switch to °F' : 'Switch to °C'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Section with enhanced spacing */}
      <div className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 lg:py-5 gap-2 sm:gap-3">
        {/* Weather Info Block */}
        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
          {/* Weather Icon Component with enhanced styling */}
          <div className="flex-shrink-0 pt-0 sm:pt-1">
            <WeatherIcon isRefreshing={isRefreshing} isDarkMode={isDarkMode} />
          </div>

          {/* Temperature & Condition Info with premium styling */}
          <div className="flex-1 flex flex-col justify-center gap-1 sm:gap-1.5 min-w-0">
            {/* Premium temperature display */}
            <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-0 sm:mb-0.5 transition-all duration-300 tracking-tight ${
              animatingField === 'temperature' ? 'scale-110' : 'scale-100'
            } bg-gradient-to-r ${
              isDarkMode 
                ? 'from-white via-blue-200 to-white' 
                : 'from-slate-900 via-blue-700 to-slate-900'
            } bg-clip-text text-transparent`}>
              {displayTemp}
            </div>
            
            {/* Condition indicator with badge style */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0 sm:mb-1">
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse transition-colors flex-shrink-0 ${
                isDarkMode ? 'bg-blue-400/80' : 'bg-blue-500'
              }`} aria-hidden="true"></div>
              <span className={`text-xs sm:text-sm md:text-base font-semibold truncate ${
                isDarkMode ? 'text-gray-300' : 'text-slate-700'
              }`}>
                {condition}
              </span>
            </div>
            
            {/* Time stamp with subtle styling */}
            <p className={`text-xs sm:text-xs md:text-sm font-medium truncate ${
              isDarkMode ? 'text-gray-500' : 'text-slate-400'
            }`}>
              {displayTime}
            </p>
          </div>
        </div>
      </div>

      {/* Details Section with enhanced styling */}
      <div className={`flex-shrink-0 space-y-0.5 sm:space-y-1 md:space-y-1.5 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-t ${
        isDarkMode ? 'border-slate-700/40' : 'border-gray-200/60'
      }`}>
        <WeatherDetailItem
          icon={Droplets}
          label="Humidity"
          value={`${humidity}%`}
          isDarkMode={isDarkMode}
          isAnimating={animatingField === 'humidity'}
        />
        <WeatherDetailItem
          icon={Wind}
          label="Wind"
          value={wind}
          isDarkMode={isDarkMode}
          isAnimating={animatingField === 'wind'}
        />
        <WeatherDetailItem
          icon={CloudRain}
          label="Rain Probability"
          value={`${rainProbability}%`}
          isDarkMode={isDarkMode}
          isAnimating={animatingField === 'rainProbability'}
        />
      </div>

      {/* Footer Section with helpful hint */}
      <div className={`flex-shrink-0 text-xs text-center px-3 sm:px-4 md:px-6 pb-2 sm:pb-2.5 md:pb-3 pt-1 sm:pt-2 transition-opacity hover:opacity-100 ${
        isDarkMode ? 'text-gray-600 hover:text-gray-500' : 'text-gray-400 hover:text-gray-500'
      }`}>
        ⚡ Use menu to toggle temperature unit
      </div>
    </div>
  );
};

WeatherCard.defaultProps = {
  isDarkMode: false,
  latitude: 28.6139, // New Delhi
  longitude: 77.2090,
  temperature: undefined,
  condition: undefined,
  time: undefined,
  humidity: undefined,
  wind: undefined,
  rainProbability: undefined,
  isLoading: undefined,
  hasError: undefined,
  onRefresh: () => {},
  showMenuOptions: true,
};

export default WeatherCard;