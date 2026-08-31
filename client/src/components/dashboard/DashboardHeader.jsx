import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Sun, Moon, Globe, HelpCircle, User, LogOut, Settings,
  MapPin, Calendar, Sprout, CloudRain, RefreshCw, ChevronDown, Check,
  Command, AlertTriangle, ShieldCheck, HelpCircle as HelpIcon, X, ArrowRight,
  TrendingUp, Activity, Layers, Play
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const DashboardHeader = ({
  effectiveUser,
  effectiveFarm,
  currentDateStr,
  isDemoMode,
  setIsDemoMode,
  language,
  setLanguage,
  exportToCSV,
  exportToPDF,
  handleRefresh,
  refreshing,
  isOffline,
  t,
  weatherAlert,
  cropHealth,
  market,
  communityAlert,
  onCropChange
}) => {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();
  const { logout } = useAuth();

  // Dropdown States
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Search Palette State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);

  // DOM Refs for outside clicks
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const weatherRef = useRef(null);
  const languageRef = useRef(null);
  const searchInputRef = useRef(null);

  // Dynamic Greeting based on time
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState('☀️');

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good Morning');
      setGreetingIcon('☀️');
    } else if (hours < 17) {
      setGreeting('Good Afternoon');
      setGreetingIcon('🌤️');
    } else {
      setGreeting('Good Evening');
      setGreetingIcon('🌙');
    }
  }, []);

  // Listen to Ctrl + K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (weatherRef.current && !weatherRef.current.contains(event.target)) {
        setWeatherOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside search command palette
  const searchItems = [
    // Modules
    { type: 'module', label: 'Smart Farm Dashboard', path: '/dashboard', icon: Activity, category: 'Dashboard Modules' },
    { type: 'module', label: 'Real-time Weather Forecast', path: '/weather', icon: CloudRain, category: 'Dashboard Modules' },
    { type: 'module', label: 'Irrigation & Soil Scheduler', path: '/irrigation', icon: Layers, category: 'Dashboard Modules' },
    { type: 'module', label: 'Crop Health Diagnostics', path: '/crop-health', icon: Sprout, category: 'Dashboard Modules' },
    { type: 'module', label: 'Mandi Prices Tracker', path: '/market', icon: TrendingUp, category: 'Dashboard Modules' },
    { type: 'module', label: 'Fertilizer Planning Tool', path: '/fertilizer-planning', icon: Settings, category: 'Dashboard Modules' },
    { type: 'module', label: 'Crop Recommendation', path: '/crop-recommendation', icon: ShieldCheck, category: 'Dashboard Modules' },
    { type: 'module', label: 'Voice AI Assistant', path: '/voice-assistant', icon: Play, category: 'Dashboard Modules' },
    { type: 'module', label: 'Farmer Settings & Setup', path: '/farm-profile', icon: User, category: 'Dashboard Modules' },

    // Crops
    { type: 'crop', label: 'Wheat (गेहूं)', value: 'Wheat', icon: Sprout, category: 'Crops Telemetry' },
    { type: 'crop', label: 'Rice (चावल)', value: 'Rice', icon: Sprout, category: 'Crops Telemetry' },
    { type: 'crop', label: 'Maize (मक्का)', value: 'Maize', icon: Sprout, category: 'Crops Telemetry' },
    { type: 'crop', label: 'Soybean (सोयाबीन)', value: 'Soybean', icon: Sprout, category: 'Crops Telemetry' },
    { type: 'crop', label: 'Cotton (कपास)', value: 'Cotton', icon: Sprout, category: 'Crops Telemetry' },
    { type: 'crop', label: 'Mustard (सरसों)', value: 'Mustard', icon: Sprout, category: 'Crops Telemetry' },

    // Actions
    { type: 'action', label: 'Toggle Judge Demo Mode', action: () => setIsDemoMode(!isDemoMode), icon: ShieldCheck, category: 'Quick System Actions' },
    { type: 'action', label: 'Toggle Light/Dark Theme', action: toggleMode, icon: Sun, category: 'Quick System Actions' },
    { type: 'action', label: 'Export Telemetry Data (CSV)', action: exportToCSV, icon: Layers, category: 'Quick System Actions' },
    { type: 'action', label: 'Print PDF Overview Report', action: exportToPDF, icon: Layers, category: 'Quick System Actions' },
    { type: 'action', label: 'Refresh Dashboard Metrics', action: handleRefresh, icon: RefreshCw, category: 'Quick System Actions' }
  ];

  const filteredSearchItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex((prev) => (prev + 1) % filteredSearchItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex((prev) => (prev - 1 + filteredSearchItems.length) % filteredSearchItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSearchItems[searchIndex]) {
        executeSearchItem(filteredSearchItems[searchIndex]);
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  const executeSearchItem = (item) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (item.type === 'module') {
      navigate(item.path);
    } else if (item.type === 'crop') {
      if (onCropChange) {
        onCropChange(item.value);
      }
    } else if (item.type === 'action') {
      item.action();
    }
  };

  // Focus search input when command palette opens
  useEffect(() => {
    if (searchOpen) {
      setSearchIndex(0);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [searchOpen]);

  // Demo active notifications list
  const activeAlerts = [
    { id: 1, type: 'critical', title: 'Heavy Rain Warning', desc: 'Precipitation exceeding 15mm expected this Saturday.', color: 'rose', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 text-rose-900 dark:text-rose-200' },
    { id: 2, type: 'warning', title: 'Pest Alert: Stem Rust', desc: 'Stem rust reported in a farm 2.4 km away.', color: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 text-amber-900 dark:text-amber-200' },
    { id: 3, type: 'info', title: 'Market Trend Alert', desc: 'Wheat Mandi price increased by 4.2% today.', color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200' }
  ];

  return (
    <div className="w-full relative select-none">
      {/* Sticky Top-level Header Bar */}
      <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-emerald-100/60 dark:border-slate-800 rounded-[2rem] p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Soft background gradient glows */}
        <div className="absolute top-0 right-0 -z-10 w-[200px] h-[200px] bg-gradient-to-br from-emerald-200/20 to-green-200/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-10 w-[150px] h-[150px] bg-emerald-100/20 rounded-full blur-2xl pointer-events-none" />

        {/* LEFT SECTION: Greeting & Farmer Stats */}
        <div className="w-full md:w-auto flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{greeting}, {effectiveUser?.name || 'Farmer'}</span>
              <motion.span
                animate={{ rotate: [0, 15, -10, 15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
                className="inline-block origin-bottom-right"
              >
                👋
              </motion.span>
            </h1>
            <span className="text-lg hidden sm:inline">{greetingIcon}</span>
          </div>
          
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold leading-tight">
            Welcome back! Here's your farm overview for today.
          </p>

          {/* Location & Date Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <MapPin size={11} className="text-emerald-600 dark:text-emerald-400" />
              {effectiveFarm?.location?.display || 'Indore, Madhya Pradesh'}
            </span>
            <span className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <Calendar size={11} className="text-emerald-600 dark:text-emerald-400" />
              {currentDateStr}
            </span>
            {isOffline && (
              <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-900/50">
                <AlertTriangle size={11} className="text-amber-600 dark:text-amber-400 animate-pulse" />
                Offline Mode
              </span>
            )}
          </div>
        </div>

        {/* CENTER SECTION: Global Command Search Bar */}
        <div className="w-full md:max-w-xs lg:max-w-md relative">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-200/30 dark:border-slate-800/80 transition-all text-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <div className="flex items-center gap-2">
              <Search size={15} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Search crops, weather, market...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md">
              <Command size={9} />
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* RIGHT SECTION: Premium Action Buttons */}
        <div className="w-full md:w-auto flex items-center justify-end sm:justify-between md:justify-end gap-2 text-slate-700 dark:text-slate-300">
          
          {/* Judge Demo Badge Toggle */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-3 py-2 rounded-2xl text-[10px] font-black transition-all border flex items-center gap-1 cursor-pointer shadow-xs ${
              isDemoMode
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className={isDemoMode ? 'text-amber-500 animate-pulse' : 'text-slate-500'}>⚡</span>
            <span>Demo: {isDemoMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Weather status capsule trigger */}
          <div className="relative" ref={weatherRef}>
              <button
                onClick={() => setWeatherOpen(!weatherOpen)}
                className={`p-2 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition shadow-xs ${weatherOpen ? 'ring-2 ring-emerald-500/20' : ''}`}
                aria-label="Weather Info"
              >
                <Sun size={15} className="text-amber-500 animate-pulse" />
                <span className="text-xs font-bold hidden xl:inline">28°C • Clear</span>
              </button>
              <AnimatePresence>
                {weatherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-emerald-100/50 dark:border-slate-800 shadow-2xl rounded-3xl p-4 z-50 text-slate-900 dark:text-white"
                  >
                    <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center justify-between mb-2">
                      <span>Live Weather Station</span>
                      <CloudRain size={12} className="text-blue-550" />
                    </h4>
                    <div className="flex items-center gap-3 py-1">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl">
                        <Sun size={28} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-black">28°C</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Feels like 30°C • Clear Sky</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <div>Humidity: <span className="text-slate-900 dark:text-white">62%</span></div>
                      <div>Wind: <span className="text-slate-900 dark:text-white">12 km/h</span></div>
                      <div>Rain Prob: <span className="text-slate-900 dark:text-white">10%</span></div>
                      <div>UV Index: <span className="text-slate-900 dark:text-white">Very High</span></div>
                    </div>
                    <Link to="/weather" className="block text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1">
                      <span>Detailed Forecast</span>
                      <ArrowRight size={12} />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications Trigger */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition relative shadow-xs ${notificationsOpen ? 'ring-2 ring-emerald-500/20' : ''}`}
                aria-label="Notifications"
              >
                <Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-emerald-100/50 dark:border-slate-800 shadow-2xl rounded-3xl p-4 z-50 text-slate-900 dark:text-white"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                      <span className="font-extrabold text-sm flex items-center gap-1.5">
                        <Bell size={15} className="text-emerald-600 dark:text-emerald-400" /> Active Farm Alerts
                      </span>
                      <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">
                        {activeAlerts.length} Alerts
                      </span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {activeAlerts.map((alert) => (
                        <div key={alert.id} className={`p-3 rounded-2xl border text-xs leading-relaxed transition hover:translate-x-0.5 ${alert.bg}`}>
                          <p className="font-extrabold text-[12px] flex items-center justify-between">
                            <span>{alert.title}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          </p>
                          <p className="opacity-80 mt-1">{alert.desc}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setNotificationsOpen(false)} className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
                      Clear Alerts
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative" ref={languageRef}>
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className={`p-2 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition shadow-xs ${languageOpen ? 'ring-2 ring-emerald-500/20' : ''}`}
                aria-label="Language Selector"
              >
                <Globe size={15} />
                <span className="text-xs font-bold uppercase">{language}</span>
                <ChevronDown size={11} className={`text-slate-500 transition-transform duration-200 ${languageOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {languageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-900 border border-emerald-100/50 dark:border-slate-800 shadow-2xl rounded-2xl p-1.5 z-50 text-slate-900 dark:text-white"
                  >
                    {[
                      { code: 'EN', name: 'English' },
                      { code: 'HI', name: 'हिन्दी' },
                      { code: 'MR', name: 'मराठी' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLanguageOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${language === lang.code ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        <span>{lang.name}</span>
                        {language === lang.code && <Check size={12} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Help Center Icon */}
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition shadow-xs"
              aria-label="Help Guide"
            >
              <HelpIcon size={15} />
            </button>

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-1.5 p-1 rounded-full bg-slate-100/85 hover:bg-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/40 dark:border-slate-700 transition cursor-pointer ${profileOpen ? 'ring-2 ring-emerald-500/20' : ''}`}
                aria-label="User profile"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-extrabold text-[12px] shadow-sm select-none">
                  {effectiveUser?.name ? effectiveUser.name.charAt(0).toUpperCase() : 'F'}
                </div>
                <ChevronDown size={12} className={`text-slate-500 dark:text-slate-400 pr-1 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-emerald-100/50 dark:border-slate-800 shadow-2xl rounded-3xl p-2 z-50 text-slate-900 dark:text-white"
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Signed in as</p>
                      <p className="font-extrabold text-sm truncate text-slate-800 dark:text-white">{effectiveUser?.name || 'Farmer'}</p>
                    </div>
                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/farm-profile');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                      >                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/farm-profile');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                      >
                        <Settings size={13} className="text-emerald-600" />
                        Farm Settings
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setNotificationsOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                      >
                        <Bell size={13} className="text-emerald-600" />
                        Notifications
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setLanguageOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                      >
                        <Globe size={13} className="text-emerald-600" />
                        Language ({language})
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setHelpOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                      >
                        <HelpIcon size={13} className="text-emerald-600" />
                        Help Center
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-left transition"
                      >
                        <LogOut size={13} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
 
      {/* SEARCH COMMAND PALETTE MODAL (Ctrl + K) */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-55 flex items-start justify-center pt-24 px-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-emerald-100/60 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[75vh]"
            >
              {/* Command Search Input Bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <Search size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  type="text"
                  placeholder="Type a crop name, module, or command..."
                  className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 border-none font-semibold w-full"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
 
              {/* Suggestions / List view */}
              <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {filteredSearchItems.length > 0 ? (
                  // Group by category
                  Object.entries(
                    filteredSearchItems.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {})
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-1">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1.5">
                        {category}
                      </h4>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const Icon = item.icon;
                          const overallIndex = filteredSearchItems.indexOf(item);
                          const active = overallIndex === searchIndex;
 
                          return (
                            <button
                              key={item.label}
                              onClick={() => executeSearchItem(item)}
                              onMouseEnter={() => setSearchIndex(overallIndex)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                active
                                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 text-xs font-bold">
                                <Icon size={14} className={active ? 'text-white' : 'text-slate-450 dark:text-slate-500'} />
                                <span>{item.label}</span>
                              </div>
                              {active && (
                                <kbd className="text-[10px] font-bold bg-emerald-700 text-white px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  Enter
                                </kbd>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs font-bold">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
 
              {/* Search Modal Footer */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 select-none">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border px-1 rounded">↑↓</kbd> Navigate</span>
                  <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border px-1 rounded">Enter</kbd> Select</span>
                </div>
                <div>
                  <span>Press <kbd className="bg-white dark:bg-slate-800 border px-1 rounded">Esc</kbd> to close</span>
                </div>
              </div>
 
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* HELP CENTER MODAL */}
      <AnimatePresence>
        {helpOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHelpOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-emerald-100/50 dark:border-slate-800 shadow-2xl rounded-[2rem] p-6 overflow-hidden text-slate-900 dark:text-white"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <HelpIcon className="text-emerald-600 dark:text-emerald-400" size={18} />
                  <span>KrishiMitra Help Center</span>
                </h3>
                <button onClick={() => setHelpOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
 
              <div className="mt-4 space-y-4 text-xs leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200">⌨️ Keyboard Shortcuts</h4>
                  <ul className="mt-1.5 space-y-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                    <li className="flex justify-between"><span>Open Search Palette:</span> <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Ctrl + K</kbd></li>
                    <li className="flex justify-between"><span>Close active modal:</span> <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Esc</kbd></li>
                  </ul>
                </div>
 
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200">🚜 KrishiMitra Core Modules</h4>
                  <ul className="mt-1.5 space-y-1.5 text-slate-600 dark:text-slate-400 font-semibold list-disc list-inside">
                    <li><strong className="text-slate-900 dark:text-white">Smart Summary:</strong> Recommended agronomic actions updated via daily real-time telemetry.</li>
                    <li><strong className="text-slate-900 dark:text-white">Weather Forecast:</strong> 7-Day predictions mapping rainfall and humidity charts.</li>
                    <li><strong className="text-slate-900 dark:text-white">Mandi Pricing:</strong> Compare market commodity price charts.</li>
                    <li><strong className="text-slate-900 dark:text-white">Voice Assistant:</strong> Read-aloud support for multilingual speech questions.</li>
                  </ul>
                </div>
 
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl">
                  <p className="font-bold text-emerald-900 dark:text-emerald-400">💡 Tip for Hackathon Judges:</p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 font-semibold">Toggle "Demo Mode" ON in the header to simulate full agricultural telemetry and smart calculations instantly without database records.</p>
                </div>
              </div>
 
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setHelpOpen(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default DashboardHeader;
