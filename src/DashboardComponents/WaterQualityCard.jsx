import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Droplets, AlertCircle, Waves, MoreHorizontal } from 'lucide-react';
import { WaterAPI } from '../api';

/**
 * pH Status Classification
 * Acidic: < 6.5 | Neutral: 6.5-8.5 | Alkaline: > 8.5
 */
const getPHStatus = (value) => {
  if (value < 6.5) return { label: 'Acidic', color: 'from-red-500 to-orange-500', textColor: 'text-red-700', bgColor: 'bg-red-50' };
  if (value > 8.5) return { label: 'Alkaline', color: 'from-blue-500 to-cyan-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
  return { label: 'Neutral', color: 'from-green-500 to-emerald-600', textColor: 'text-green-700', bgColor: 'bg-green-50' };
};

/**
 * Dissolved Oxygen Status Classification
 * Poor: < 5 mg/L | Moderate: 5-7 mg/L | Good: >= 7 mg/L
 */
const getDOStatus = (value) => {
  if (value < 5) return { label: 'Poor', severity: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
  if (value < 7) return { label: 'Moderate', severity: 'moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  return { label: 'Good', severity: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
};

/**
 * Pollution Level Classification
 */
const getPollutionStatus = (level) => {
  const levels = {
    low: { label: 'Low', color: 'from-green-500 to-emerald-600', textColor: 'text-green-700', bgColor: 'bg-green-100' },
    moderate: { label: 'Moderate', color: 'from-yellow-500 to-amber-600', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    high: { label: 'High', color: 'from-red-500 to-orange-600', textColor: 'text-red-700', bgColor: 'bg-red-100' },
  };
  return levels[level] || levels.low;
};

const CITY_WATER_MOCKS = [
  {
    city: 'New Delhi',
    lat: 28.6139,
    lon: 77.2090,
    samples: [
      { ph: 7.2, dissolvedOxygen: 6.8, pollutionLevel: 'low', temperature: 22, turbidity: 'Clear', siteName: 'Yamuna River - Station A', timestamp: '2026-03-21T08:10:00.000Z' },
      { ph: 6.6, dissolvedOxygen: 5.4, pollutionLevel: 'moderate', temperature: 25, turbidity: 'Slightly Cloudy', siteName: 'Okhla Wetland Edge', timestamp: '2026-03-21T09:35:00.000Z' },
      { ph: 8.1, dissolvedOxygen: 6.1, pollutionLevel: 'moderate', temperature: 26, turbidity: 'Turbid', siteName: 'Canal Monitoring Point 3', timestamp: '2026-03-21T11:05:00.000Z' },
    ],
  },
  {
    city: 'Mumbai',
    lat: 19.0760,
    lon: 72.8777,
    samples: [
      { ph: 7.4, dissolvedOxygen: 6.2, pollutionLevel: 'moderate', temperature: 27, turbidity: 'Slightly Cloudy', siteName: 'Mithi River Belt', timestamp: '2026-03-21T08:20:00.000Z' },
      { ph: 7.1, dissolvedOxygen: 7.0, pollutionLevel: 'low', temperature: 28, turbidity: 'Clear', siteName: 'Powai Lake Station', timestamp: '2026-03-21T10:00:00.000Z' },
      { ph: 6.8, dissolvedOxygen: 5.1, pollutionLevel: 'high', temperature: 29, turbidity: 'Turbid', siteName: 'Creek Outfall Point', timestamp: '2026-03-21T12:05:00.000Z' },
    ],
  },
  {
    city: 'Bengaluru',
    lat: 12.9716,
    lon: 77.5946,
    samples: [
      { ph: 7.0, dissolvedOxygen: 7.3, pollutionLevel: 'low', temperature: 24, turbidity: 'Clear', siteName: 'Ulsoor Lake Sensor', timestamp: '2026-03-21T07:55:00.000Z' },
      { ph: 6.9, dissolvedOxygen: 6.6, pollutionLevel: 'moderate', temperature: 25, turbidity: 'Slightly Cloudy', siteName: 'Bellandur Inlet', timestamp: '2026-03-21T09:40:00.000Z' },
      { ph: 7.5, dissolvedOxygen: 6.1, pollutionLevel: 'moderate', temperature: 26, turbidity: 'Turbid', siteName: 'Storm Canal Junction', timestamp: '2026-03-21T11:30:00.000Z' },
    ],
  },
  {
    city: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    samples: [
      { ph: 7.3, dissolvedOxygen: 6.5, pollutionLevel: 'moderate', temperature: 26, turbidity: 'Slightly Cloudy', siteName: 'Hooghly East Bank', timestamp: '2026-03-21T08:05:00.000Z' },
      { ph: 7.6, dissolvedOxygen: 6.9, pollutionLevel: 'low', temperature: 27, turbidity: 'Clear', siteName: 'Wetland Reserve Node', timestamp: '2026-03-21T10:25:00.000Z' },
      { ph: 6.7, dissolvedOxygen: 5.0, pollutionLevel: 'high', temperature: 28, turbidity: 'Turbid', siteName: 'Drain Confluence Point', timestamp: '2026-03-21T12:15:00.000Z' },
    ],
  },
];

const DEFAULT_SAMPLES = [
  { ph: 7.1, dissolvedOxygen: 6.4, pollutionLevel: 'moderate', temperature: 23, turbidity: 'Slightly Cloudy', siteName: 'City Water Station A', timestamp: '2026-03-21T08:00:00.000Z' },
  { ph: 7.4, dissolvedOxygen: 7.1, pollutionLevel: 'low', temperature: 22, turbidity: 'Clear', siteName: 'City Water Station B', timestamp: '2026-03-21T10:00:00.000Z' },
  { ph: 6.8, dissolvedOxygen: 5.3, pollutionLevel: 'high', temperature: 25, turbidity: 'Turbid', siteName: 'City Water Station C', timestamp: '2026-03-21T12:00:00.000Z' },
];

const getDistanceSquared = (lat1, lon1, lat2, lon2) => ((lat1 - lat2) ** 2) + ((lon1 - lon2) ** 2);

/**
 * MetricItem - Reusable metric display component
 */
// eslint-disable-next-line no-unused-vars
const MetricItem = ({ icon: Icon, label, value, unit, status, isDarkMode, progressValue, progressMax }) => (
  <div className={`flex items-start gap-3 p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${
    isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-blue-50/50'
  }`}>
    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-colors ${
      isDarkMode ? 'text-blue-400' : 'text-blue-600'
    }`} aria-hidden="true" />
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
          {label}
        </span>
        {status && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${status.bgColor} ${status.color}`}>
            {status.label}
          </span>
        )}
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </span>
        {unit && (
          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
            {unit}
          </span>
        )}
      </div>
      
      {progressValue !== undefined && progressMax && (
        <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${(progressValue / progressMax) * 100}%` }}
            role="progressbar"
            aria-valuenow={progressValue}
            aria-valuemin="0"
            aria-valuemax={progressMax}
          />
        </div>
      )}
    </div>
  </div>
);

/**
 * WaterQualityCard - Water Quality Demo Component (No API Calls)
 */
const WaterQualityCard = ({
  isDarkMode = false,
  showMenu = true,
  location = { lat: 28.6139, lon: 77.2090 },
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mockIndex, setMockIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLiveError, setHasLiveError] = useState(false);
  const [liveWaterData, setLiveWaterData] = useState(null);

  const cityMock = useMemo(() => {
    const lat = Number(location?.lat);
    const lon = Number(location?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { city: 'Selected City', samples: DEFAULT_SAMPLES };
    }

    let nearest = CITY_WATER_MOCKS[0];
    let best = Number.POSITIVE_INFINITY;

    CITY_WATER_MOCKS.forEach((entry) => {
      const distance = getDistanceSquared(lat, lon, entry.lat, entry.lon);
      if (distance < best) {
        best = distance;
        nearest = entry;
      }
    });

    return nearest || { city: 'Selected City', samples: DEFAULT_SAMPLES };
  }, [location?.lat, location?.lon]);

  const activeSamples = cityMock.samples?.length ? cityMock.samples : DEFAULT_SAMPLES;
  const cityHash = useMemo(
    () => cityMock.city.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0),
    [cityMock.city]
  );
  const effectiveIndex = (mockIndex + cityHash) % activeSamples.length;
  const mockWaterData = activeSamples[effectiveIndex];

  useEffect(() => {
    const lat = Number(location?.lat);
    const lon = Number(location?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setLiveWaterData(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLiveWater = async () => {
      setIsLoading(true);
      setHasLiveError(false);

      try {
        const live = await WaterAPI.get(lat, lon);
        if (cancelled) return;

        const normalized = {
          ...mockWaterData,
          ...live,
          pollutionLevel: String(live?.pollutionLevel || mockWaterData.pollutionLevel || 'moderate').toLowerCase(),
          siteName: live?.siteName || mockWaterData.siteName,
          timestamp: live?.timestamp || new Date().toISOString(),
          turbidity: live?.turbidity || mockWaterData.turbidity,
        };

        setLiveWaterData(normalized);
      } catch (error) {
        if (cancelled) return;
        console.error('❌ WaterQualityCard: failed to fetch live water data', error);
        setLiveWaterData(null);
        setHasLiveError(true);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchLiveWater();

    return () => {
      cancelled = true;
    };
  }, [location?.lat, location?.lon, mockWaterData]);

  const waterData = liveWaterData || mockWaterData;

  // Derived states from waterData
  const phStatus = useMemo(() => getPHStatus(waterData.ph), [waterData.ph]);
  const doStatus = useMemo(() => getDOStatus(waterData.dissolvedOxygen), [waterData.dissolvedOxygen]);
  const pollutionStatus = useMemo(() => getPollutionStatus(waterData.pollutionLevel), [waterData.pollutionLevel]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    const lat = Number(location?.lat);
    const lon = Number(location?.lon);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      try {
        const live = await WaterAPI.get(lat, lon, { force: true });
        const normalized = {
          ...mockWaterData,
          ...live,
          pollutionLevel: String(live?.pollutionLevel || mockWaterData.pollutionLevel || 'moderate').toLowerCase(),
          siteName: live?.siteName || mockWaterData.siteName,
          timestamp: live?.timestamp || new Date().toISOString(),
          turbidity: live?.turbidity || mockWaterData.turbidity,
        };
        setLiveWaterData(normalized);
        setHasLiveError(false);
      } catch (error) {
        console.error('❌ WaterQualityCard: refresh failed, showing mock fallback', error);
        setHasLiveError(true);
        setLiveWaterData(null);
        setMockIndex((prev) => (prev + 1) % activeSamples.length);
      }
    } else {
      setLiveWaterData(null);
      setMockIndex((prev) => (prev + 1) % activeSamples.length);
    }

    setTimeout(() => setIsRefreshing(false), 800);
  }, [isRefreshing, location?.lat, location?.lon, mockWaterData, activeSamples.length]);

  // Close menu on outside click
  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (isLoading && !liveWaterData) {
    return (
      <div className={`rounded-2xl p-4 sm:p-6 shadow-lg transition-all duration-300 ${
        isDarkMode
          ? 'bg-slate-800 border border-slate-700'
          : 'bg-white border border-gray-100'
      }`} role="status" aria-label="Loading water quality information" aria-busy="true">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
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

  return (
    <div
      className={`rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] flex flex-col min-h-[430px] ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 hover:border-slate-600/80 backdrop-blur-sm'
          : 'bg-gradient-to-br from-white to-blue-50/50 border border-cyan-200/60 hover:border-cyan-300/80 backdrop-blur-sm'
      }`}
      style={{ animation: 'slideUp 0.5s ease-out' }}
      role="region"
      aria-label="Water quality information"
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
      <div className={`flex items-center justify-between flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-0 border-b ${
        isDarkMode ? 'border-slate-700/30' : 'border-cyan-200/30'
      }`}>
        <h3 className={`font-bold text-base sm:text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Water Quality
        </h3>

        {showMenu && (
          <div className="relative">
            <button
              onClick={handleMenuClick}
              className={`p-1.5 rounded-lg transition-all duration-300 group ${
                isDarkMode
                  ? 'hover:bg-slate-700/60 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-cyan-100/50 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Water quality menu options"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="w-5 h-5 transition-transform group-hover:scale-110" aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-2xl overflow-hidden z-50 transition-all duration-200 menu-enter backdrop-blur-md ${
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
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 font-medium ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-slate-600/50 border-b border-slate-600/30'
                      : 'text-gray-700 hover:bg-cyan-50/70 border-b border-gray-100/50'
                  }`}
                  role="menuitem"
                  aria-label="Refresh water quality data"
                >
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 py-2 sm:py-3">
        {/* pH Level Metric */}
        <MetricItem
          icon={Droplets}
          label="pH Level"
          value={waterData.ph.toFixed(1)}
          unit="(0-14)"
          status={phStatus}
          isDarkMode={isDarkMode}
          progressValue={waterData.ph}
          progressMax={14}
        />

        {/* Dissolved Oxygen Metric */}
        <MetricItem
          icon={Waves}
          label="Dissolved Oxygen"
          value={waterData.dissolvedOxygen.toFixed(1)}
          unit="mg/L"
          status={doStatus}
          isDarkMode={isDarkMode}
          progressValue={waterData.dissolvedOxygen}
          progressMax={12}
        />

        {/* Pollution Level Metric */}
        <div className={`flex items-start gap-3 p-2 sm:p-2.5 rounded-lg transition-all duration-300 ${
          isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-blue-50/50'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-colors ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} aria-hidden="true" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                Pollution Level
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pollutionStatus.bgColor} ${pollutionStatus.textColor}`}>
                {pollutionStatus.label}
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                Status:
              </span>
              <span className={`text-xs font-semibold ${
                isDarkMode ? 'text-gray-200' : 'text-slate-900'
              }`}>
                {waterData.pollutionLevel === 'low' ? 'Safe for aquatic life' : 
                 waterData.pollutionLevel === 'moderate' ? 'Caution advised' : 
                 'High contamination'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {/* Temperature */}
          <div className={`p-2 sm:p-2.5 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-blue-50/50'}`}>
            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              Temp
            </p>
            <p className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {waterData.temperature}°C
            </p>
          </div>

          {/* Turbidity */}
          <div className={`p-2 sm:p-2.5 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-blue-50/50'}`}>
            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              Clarity
            </p>
            <p className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {waterData.turbidity}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className={`flex-shrink-0 text-xs text-center px-4 sm:px-6 pb-3 sm:pb-4 pt-0 transition-opacity hover:opacity-100 ${
        isDarkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {cityMock.city} | {waterData.siteName} | {new Date(waterData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {liveWaterData ? 'Live API data' : 'Mock fallback'}{hasLiveError ? ' (live unavailable)' : ''}
      </div>
    </div>
  );
};

WaterQualityCard.defaultProps = {
  isDarkMode: false,
  showMenu: true,
  location: { lat: 28.6139, lon: 77.2090 },
};

export default WaterQualityCard;