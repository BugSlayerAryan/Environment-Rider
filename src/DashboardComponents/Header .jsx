/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, User, Moon, Sun, Leaf, Settings, LogOut, Map, TrendingUp, ArrowRight, Menu, X
} from 'lucide-react';
/* eslint-enable no-unused-vars */

const Header = ({ isDarkMode = true, onLocationSelect = () => {}, onDarkModeToggle = () => {} }) => {
  const [searchFocus, setSearchFocus] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const date = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentDate(date.toLocaleDateString('en-US', options));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'Air Quality Alert', message: 'PM2.5 levels rising in New Delhi', time: '2 min ago', urgent: true },
    { id: 2, title: 'Weather Update', message: 'Light rain expected tomorrow', time: '1 hour ago', urgent: false },
    { id: 3, title: 'System Update', message: 'All sensors updated successfully', time: '3 hours ago', urgent: false },
  ];

  // Geocoding function to convert city name to coordinates
  const getCoordinatesFromCity = async (cityName) => {
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?city=${cityName}&format=json&limit=1`;
    const response = await fetch(geocodingUrl);
    const data = await response.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
    }
    throw new Error('Location not found');
  };

  // Handle location search
  const handleLocationSearch = async (location) => {
    try {
      // Get coordinates from city name
      const { lat, lon, displayName } = await getCoordinatesFromCity(location);
      const cityName = displayName?.split(',')?.[0]?.trim() || location;
      
      // Call the callback to update parent component
      onLocationSelect({ lat, lon, cityName });
      
      // Clear search after successful selection
      setSearchValue('');
      setSearchFocus(false);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      handleLocationSearch(searchValue.trim());
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-2xl transition-all duration-300 border-b ${ 
        isDarkMode
          ? 'bg-gradient-to-b from-slate-950/95 to-slate-900/80 border-slate-700/50 shadow-2xl'
          : 'bg-gradient-to-b from-white/95 to-blue-50/80 border-gray-200/50 shadow-xl'
      }`}
    >
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes notificationPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animate-notification-pulse {
          animation: notificationPulse 2s ease-in-out infinite;
        }

        .search-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.1) 50%,
            rgba(255,255,255,0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className="px-2 xs:px-3 sm:px-6 md:px-7 lg:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 lg:py-4">
        {/* Unified Responsive Header */}
        <div className="flex items-center justify-between gap-2 xs:gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Left Section: Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1 xs:gap-1.5 sm:gap-3 flex-shrink-0"
          >
            <motion.div
              whileHover={{ rotate: 20 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 via-green-500 to-cyan-600 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 cursor-pointer flex-shrink-0"
            >
              <Leaf className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div className="hidden md:block">
              <div className="text-base xs:text-lg sm:text-xl md:text-xl lg:text-2xl font-black bg-gradient-to-r from-emerald-500 via-green-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
                Environmental Monitor
              </div>
              <div className={`text-xs font-medium tracking-wider hidden sm:block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Real-time Monitoring
              </div>
            </div>
            <div className="md:hidden">
              <div className="text-sm xs:text-base sm:text-lg font-black bg-gradient-to-r from-emerald-500 to-cyan-600 bg-clip-text text-transparent">
                Env
              </div>
            </div>
          </motion.div>

          {/* Center: Unified Search Bar */}
          <motion.div
            layout
            className="flex-1 min-w-0 max-w-md md:max-w-xl lg:max-w-3xl"
          >
            <motion.div
              animate={{
                boxShadow: searchFocus
                  ? isDarkMode
                    ? '0 0 30px rgba(16, 185, 129, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.1)'
                    : '0 0 30px rgba(16, 185, 129, 0.3), inset 0 0 15px rgba(16, 185, 129, 0.1)'
                  : isDarkMode
                  ? '0 0 10px rgba(16, 185, 129, 0.1)'
                  : '0 0 8px rgba(16, 185, 129, 0.1)',
              }}
              className={`flex items-center gap-2 xs:gap-2.5 sm:gap-3 px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3.5 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 border w-full ring-0 ${
                isDarkMode
                  ? searchFocus
                    ? 'bg-slate-800/90 border-emerald-500/60 ring-2 ring-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800/70 hover:border-slate-600/50'
                  : searchFocus
                  ? 'bg-white/95 border-emerald-400/70 ring-2 ring-emerald-400/20'
                  : 'bg-gray-100/70 border-gray-300/50 hover:bg-gray-100/90 hover:border-gray-300/70'
              }`}
            >
              <Search className={`w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 flex-shrink-0 transition-colors ${
                searchFocus
                  ? 'text-emerald-500'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search location..."
                className={`flex-1 bg-transparent outline-none text-sm xs:text-base placeholder-opacity-60 transition-colors min-w-0 font-medium ${
                  isDarkMode
                    ? 'text-white placeholder-gray-400'
                    : 'text-slate-900 placeholder-gray-500'
                }`}
                aria-label="Search location"
              />
              {searchValue && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 px-2.5 xs:px-3.5 sm:px-4 py-1 xs:py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isDarkMode
                      ? 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800/70 shadow-md'
                      : 'bg-emerald-100/90 text-emerald-700 hover:bg-emerald-200 shadow-md'
                  }`}
                  onClick={() => setSearchValue('')}
                >
                  Clear
                </motion.button>
              )}
            </motion.div>


          </motion.div>

          {/* Right Section: Premium Actions */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 lg:gap-3 flex-shrink-0">
            {/* Date - Enhanced */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`hidden lg:flex flex-col items-end px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2 rounded-lg xs:rounded-xl transition-all ${
                isDarkMode
                  ? 'bg-slate-800/40 hover:bg-slate-800/60'
                  : 'bg-gray-100/50 hover:bg-gray-100/80'
              }`}
            >
              <span className={`text-xs font-bold tracking-wider ${ 
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {currentDate.split(',')[0]}
              </span>
              <span className={`text-xs opacity-70 ${ 
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {currentDate.split(',').slice(1).join(',')}
              </span>
            </motion.div>

            {/* Dark Mode Toggle - Clickable */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 20 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDarkModeToggle}
              className={`p-2 xs:p-2.5 rounded-lg xs:rounded-xl transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-slate-800 to-slate-700 text-yellow-400 shadow-lg hover:shadow-xl hover:shadow-yellow-500/20'
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 text-orange-500 shadow-md hover:shadow-lg hover:shadow-orange-500/20'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              )}
            </motion.button>

            {/* Notifications - Premium (Desktop) */}
            <div className="hidden sm:block relative" ref={notificationRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 xs:p-2.5 rounded-lg xs:rounded-xl transition-all duration-300 relative group ${ 
                  isDarkMode
                    ? 'bg-slate-800/40 hover:bg-slate-800/70 text-gray-300 hover:text-white'
                    : 'bg-gray-100/60 hover:bg-gray-100/90 text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Notifications"
              >
                <Bell className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-lg shadow-red-500/50 animate-notification-pulse"
                />
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 xs:mt-3 w-80 xs:w-96 sm:w-80 md:w-96 rounded-xl xs:rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border max-h-96 xs:max-h-[28rem] ${ 
                      isDarkMode
                        ? 'bg-slate-800/95 border-slate-700/50 text-white'
                        : 'bg-white/95 border-gray-200/50 text-slate-900'
                    }`}
                  >
                    <div className={`px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-b ${ 
                      isDarkMode ? 'border-slate-700/30' : 'border-gray-200/50'
                    }`}>
                      <h3 className="font-bold text-base xs:text-lg">Notifications</h3>
                      <p className={`text-xs opacity-70 ${ 
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        You have 3 updates
                      </p>
                    </div>

                    <div className="overflow-y-auto">
                      {notifications.map((notif, index) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 border-b hover:bg-opacity-50 transition-colors cursor-pointer ${ 
                            isDarkMode 
                              ? `border-slate-700/20 hover:bg-emerald-900/20 ${notif.urgent ? 'bg-red-900/10' : ''}`
                              : `border-gray-200/30 hover:bg-gray-100/50 ${notif.urgent ? 'bg-red-100/30' : ''}`
                          }`}
                        >
                          <div className="flex gap-2 xs:gap-3">
                            <motion.div
                              animate={notif.urgent ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 xs:mt-1.5 ${ 
                                notif.urgent
                                  ? 'bg-gradient-to-r from-red-400 to-red-600 shadow-lg'
                                  : 'bg-gradient-to-r from-emerald-400 to-green-500'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs xs:text-sm">{notif.title}</p>
                              <p className={`text-xs opacity-70 line-clamp-2 ${ 
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {notif.message}
                              </p>
                              <p className={`text-xs opacity-50 mt-1 ${ 
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {notif.time}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 text-center text-xs xs:text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors ${ 
                        isDarkMode
                          ? 'hover:bg-slate-700/30 text-emerald-400 hover:text-emerald-300'
                          : 'hover:bg-gray-100/50 text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile - Premium (Desktop) */}
            <div className="hidden sm:block relative" ref={profileRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfile(!showProfile)}
                className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-lg xs:rounded-xl flex items-center justify-center transition-all duration-300 group ${ 
                  isDarkMode
                    ? 'bg-gradient-to-br from-emerald-500/80 to-cyan-600/80 hover:from-emerald-500 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:shadow-emerald-500/40'
                    : 'bg-gradient-to-br from-emerald-400/90 to-cyan-500/90 hover:from-emerald-400 hover:to-cyan-500 shadow-lg hover:shadow-xl hover:shadow-emerald-400/40'
                }`}
                aria-label="User profile"
              >
                <User className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
              </motion.button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 xs:mt-3 w-72 xs:w-80 rounded-xl xs:rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border ${ 
                      isDarkMode
                        ? 'bg-slate-800/95 border-slate-700/50 text-white'
                        : 'bg-white/95 border-gray-200/50 text-slate-900'
                    }`}
                  >
                    {/* Profile Header */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-b bg-gradient-to-r ${ 
                        isDarkMode
                          ? 'from-emerald-900/30 to-cyan-900/30 border-slate-700/30'
                          : 'from-emerald-100/50 to-cyan-100/50 border-gray-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 xs:gap-3 mb-2">
                        <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs xs:text-sm truncate">Admin User</p>
                          <p className={`text-xs opacity-70 truncate ${ 
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            admin@ecosystem.com
                          </p>
                        </div>
                      </div>
                      <div className={`inline-flex gap-1.5 text-xs font-semibold rounded-lg px-2 py-1 mt-2 ${ 
                        isDarkMode
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-emerald-200/50 text-emerald-700'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        <span>Premium</span>
                      </div>
                    </motion.div>

                    {/* Menu Items */}
                    <div className="px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2">
                      {[
                        { icon: Settings, label: 'Settings', color: 'blue' },
                        { icon: Map, label: 'Preferences', color: 'purple' },
                      ].map((item, index) => (
                        <motion.button
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + index * 0.05 }}
                          whileHover={{ x: 4 }}
                          className={`w-full text-left px-2 xs:px-3 py-2 xs:py-2.5 rounded-lg flex items-center gap-2 xs:gap-3 transition-colors text-xs xs:text-sm font-medium ${ 
                            isDarkMode
                              ? 'hover:bg-slate-700/50 text-gray-200'
                              : 'hover:bg-gray-100/70 text-gray-700'
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Logout Button */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      whileHover={{ x: 4 }}
                      className={`w-full text-left px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 border-t font-semibold text-xs xs:text-sm flex items-center gap-2 xs:gap-3 transition-colors ${ 
                        isDarkMode
                          ? 'border-slate-700/30 text-red-400 hover:bg-red-900/20'
                          : 'border-gray-200/50 text-red-600 hover:bg-red-100/50'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
                      <span>Logout</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu - Hamburger (Mobile View Only) */}
            <div className="sm:hidden relative" ref={mobileMenuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-2 xs:p-2.5 rounded-lg xs:rounded-xl transition-all duration-300 ${ 
                  isDarkMode
                    ? 'bg-slate-800/40 hover:bg-slate-800/70 text-gray-300 hover:text-white'
                    : 'bg-gray-100/60 hover:bg-gray-100/90 text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Menu"
              >
                <motion.div
                  animate={{ rotate: showMobileMenu ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {showMobileMenu ? (
                    <X className="w-5 h-5 xs:w-6 xs:h-6" />
                  ) : (
                    <Menu className="w-5 h-5 xs:w-6 xs:h-6" />
                  )}
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {showMobileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 xs:mt-3 w-72 xs:w-80 rounded-xl xs:rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border max-h-96 xs:max-h-[28rem] flex flex-col ${ 
                      isDarkMode
                        ? 'bg-slate-800/95 border-slate-700/50 text-white'
                        : 'bg-white/95 border-gray-200/50 text-slate-900'
                    }`}
                  >
                    {/* Mobile Menu - Notifications Section */}
                    <div className={`border-b ${ 
                      isDarkMode ? 'border-slate-700/30' : 'border-gray-200/50'
                    }`}>
                      <div className={`px-3 xs:px-4 py-2 xs:py-3 ${ 
                        isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50/50'
                      }`}>
                        <h4 className="font-bold text-sm xs:text-base flex items-center gap-2">
                          <Bell className="w-4 h-4 xs:w-5 xs:h-5" />
                          Notifications
                        </h4>
                      </div>
                      <div className="max-h-40 xs:max-h-48 overflow-y-auto">
                        {notifications.slice(0, 2).map((notif, index) => (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`px-3 xs:px-4 py-2 xs:py-2.5 border-b hover:bg-opacity-50 transition-colors cursor-pointer ${ 
                              isDarkMode 
                                ? `border-slate-700/20 hover:bg-emerald-900/20 ${notif.urgent ? 'bg-red-900/10' : ''}`
                                : `border-gray-200/30 hover:bg-gray-100/50 ${notif.urgent ? 'bg-red-100/30' : ''}`
                            }`}
                          >
                            <div className="flex gap-2 xs:gap-2.5 items-start">
                              <motion.div
                                animate={notif.urgent ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${ 
                                  notif.urgent
                                    ? 'bg-gradient-to-r from-red-400 to-red-600'
                                    : 'bg-gradient-to-r from-emerald-400 to-green-500'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs xs:text-sm truncate">{notif.title}</p>
                                <p className={`text-xs opacity-70 line-clamp-1 ${ 
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Menu - Profile Section */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className={`px-3 xs:px-4 py-2 xs:py-3 border-b bg-gradient-to-r ${ 
                        isDarkMode
                          ? 'from-emerald-900/20 to-cyan-900/20 border-slate-700/30'
                          : 'from-emerald-100/40 to-cyan-100/40 border-gray-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 xs:gap-3 mb-2">
                        <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs xs:text-sm truncate">Admin User</p>
                          <p className={`text-xs opacity-70 truncate ${ 
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            admin@ecosystem.com
                          </p>
                        </div>
                      </div>
                      <div className={`inline-flex gap-1 text-xs font-semibold rounded-lg px-2 py-1 ${ 
                        isDarkMode
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-emerald-200/50 text-emerald-700'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        <span>Premium</span>
                      </div>
                    </motion.div>

                    {/* Mobile Menu - Quick Actions */}
                    <div className="flex-1 px-3 xs:px-4 py-2">
                      {[
                        { icon: Settings, label: 'Settings', color: 'blue' },
                        { icon: Map, label: 'Preferences', color: 'purple' },
                      ].map((item, index) => (
                        <motion.button
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                          whileHover={{ x: 4 }}
                          className={`w-full text-left px-2 xs:px-3 py-2 rounded-lg flex items-center gap-2 xs:gap-3 transition-colors text-xs xs:text-sm font-medium ${ 
                            isDarkMode
                              ? 'hover:bg-slate-700/50 text-gray-200'
                              : 'hover:bg-gray-100/70 text-gray-700'
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Mobile Menu - Logout Button */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ x: 4 }}
                      className={`w-full text-left px-3 xs:px-4 py-2 xs:py-2.5 border-t font-semibold text-xs xs:text-sm flex items-center gap-2 xs:gap-3 transition-colors ${ 
                        isDarkMode
                          ? 'border-slate-700/30 text-red-400 hover:bg-red-900/20'
                          : 'border-gray-200/50 text-red-600 hover:bg-red-100/50'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
                      <span>Logout</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;