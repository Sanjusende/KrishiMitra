import React, { useEffect, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary, getDashboardAnalytics } from '../services/dashboardService';
import { getWeatherForecast } from '../services/weatherService';
import { getMarketHistory } from '../services/marketService';
import { getCropRecommendations } from '../services/cropRecommendationService';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Droplets,
  CloudRain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Mic,
  Sprout,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Info,
  Bell,
  Sun,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Thermometer,
  Wind,
  Layers,
  Clock,
  X,
} from 'lucide-react';
import Button from '../components/ui/Button';

// Base comparison dataset for crop price comparison bar chart
const CROP_PRICE_COMPARISON_DATA = [
  { crop: 'Wheat', price: 2450, fill: '#10B981' },
  { crop: 'Rice', price: 2200, fill: '#3B82F6' },
  { crop: 'Maize', price: 1950, fill: '#F59E0B' },
  { crop: 'Soybean', price: 4600, fill: '#8B5CF6' },
  { crop: 'Cotton', price: 6800, fill: '#EC4899' },
  { crop: 'Mustard', price: 5350, fill: '#06B6D4' },
];

// Crop allocation data for Pie Chart representation
const CROP_DISTRIBUTION_DATA = [
  { name: 'Wheat', value: 50, fill: '#10B981' },
  { name: 'Soybean', value: 25, fill: '#8B5CF6' },
  { name: 'Maize', value: 15, fill: '#F59E0B' },
  { name: 'Fallow', value: 10, fill: '#64748B' },
];

// Fallback forecast telemetry if offline
const FALLBACK_FORECAST = [
  {
    day: 'Today',
    date: 'Aug 13',
    tempMax: 30,
    tempMin: 22,
    tempAvg: 26,
    rainProbability: 10,
    rainfallMm: 0,
    humidity: 62,
    condition: 'Sunny',
  },
  {
    day: 'Fri',
    date: 'Aug 14',
    tempMax: 29,
    tempMin: 21,
    tempAvg: 25,
    rainProbability: 15,
    rainfallMm: 0,
    humidity: 60,
    condition: 'Clear',
  },
  {
    day: 'Sat',
    date: 'Aug 15',
    tempMax: 28,
    tempMin: 21,
    tempAvg: 24,
    rainProbability: 40,
    rainfallMm: 2.5,
    humidity: 68,
    condition: 'Partly Cloudy',
  },
  {
    day: 'Sun',
    date: 'Aug 16',
    tempMax: 27,
    tempMin: 20,
    tempAvg: 23,
    rainProbability: 60,
    rainfallMm: 8.0,
    humidity: 75,
    condition: 'Light Rain',
  },
  {
    day: 'Mon',
    date: 'Aug 17',
    tempMax: 29,
    tempMin: 21,
    tempAvg: 25,
    rainProbability: 20,
    rainfallMm: 0.5,
    humidity: 65,
    condition: 'Passing Showers',
  },
  {
    day: 'Tue',
    date: 'Aug 18',
    tempMax: 30,
    tempMin: 22,
    tempAvg: 26,
    rainProbability: 10,
    rainfallMm: 0,
    humidity: 58,
    condition: 'Clear',
  },
  {
    day: 'Wed',
    date: 'Aug 19',
    tempMax: 31,
    tempMin: 23,
    tempAvg: 27,
    rainProbability: 5,
    rainfallMm: 0,
    humidity: 55,
    condition: 'Sunny',
  },
];

const Dashboard = () => {
  const { farm, isProfileComplete } = useFarm();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary State Data
  const [dashboardData, setDashboardData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [marketHistoryData, setMarketHistoryData] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [weatherMetric, setWeatherMetric] = useState('temp'); // 'temp' | 'rain' | 'humidity'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');
  const [cropRecommendations, setCropRecommendations] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch Dashboard Core Summary
  const fetchDashboard = async () => {
    try {
      setError(null);
      const res = await getDashboardSummary();
      if (res?.success) {
        setDashboardData(res.data);
        if (res.data?.farm?.currentCrop) {
          setSelectedCrop(res.data.farm.currentCrop);
        }
      } else if (res?.profileComplete === false) {
        setDashboardData(null);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Unable to load latest dashboard summary. Please retry.');
    }
  };

  // Fetch Weather Forecast Series
  const fetchForecast = async () => {
    try {
      const res = await getWeatherForecast();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map((f, idx) => {
          const dateObj = new Date(f.date);
          const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return {
            ...f,
            day: dayName,
            date: dateStr,
            tempAvg: Math.round(((f.tempMax ?? 30) + (f.tempMin ?? 20)) / 2),
          };
        });
        setForecastData(formatted);
      } else {
        setForecastData(FALLBACK_FORECAST);
      }
    } catch (err) {
      setForecastData(FALLBACK_FORECAST);
    }
  };

  // Fetch Crop Recommendations
  const fetchRecommendations = async () => {
    try {
      const res = await getCropRecommendations();
      if (res?.success && Array.isArray(res.data)) {
        setCropRecommendations(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  // Fetch Market History for Chart
  const fetchMarketChart = async (crop, period) => {
    try {
      const res = await getMarketHistory(crop, period);
      if (res?.success && res.data && Array.isArray(res.data.series)) {
        setMarketHistoryData(res.data.series);
      } else {
        setMarketHistoryData([]);
      }
    } catch (err) {
      setMarketHistoryData([]);
    }
  };

  // Fetch Analytics (Weekly, Monthly, Yearly MongoDB aggregation)
  const fetchAnalytics = async (p = analyticsPeriod) => {
    try {
      const res = await getDashboardAnalytics(p);
      if (res?.success) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchForecast(),
        fetchRecommendations(),
        fetchAnalytics(analyticsPeriod),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  // Update Market History when crop or period changes
  useEffect(() => {
    fetchMarketChart(selectedCrop, selectedPeriod);
  }, [selectedCrop, selectedPeriod]);

  // Update Aggregated Analytics when period changes
  useEffect(() => {
    fetchAnalytics(analyticsPeriod);
  }, [analyticsPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboard(),
      fetchForecast(),
      fetchRecommendations(),
      fetchMarketChart(selectedCrop, selectedPeriod),
      fetchAnalytics(analyticsPeriod),
    ]);
    setRefreshing(false);
  };

  // Loading Skeleton View
  if (loading && !refreshing) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-28 bg-slate-200 rounded-3xl w-full animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-3xl animate-pulse" />
          <div className="h-80 bg-slate-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Profile Incomplete Guard
  if (!isProfileComplete && !loading) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-3xl border border-emerald-100 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Sprout className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Set Up Your Farm Profile</h2>
        <p className="text-slate-600 max-w-md mx-auto text-sm">
          To receive personalized irrigation guidance, real-time weather risk alerts, and mandi
          commodity intelligence, please complete your farm setup.
        </p>
        <Button
          onClick={() => navigate('/farm-profile')}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg"
        >
          Complete Setup
        </Button>
      </div>
    );
  }

  const { todaysAction, weatherAlert, cropHealth, market, communityAlert, fertilizerShortcut } =
    dashboardData || {};

  // Formatted Current Date String
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate Market Overview Stats
  const topCropPrice = Math.max(...CROP_PRICE_COMPARISON_DATA.map((c) => c.price));
  const lowestCropPrice = Math.min(...CROP_PRICE_COMPARISON_DATA.map((c) => c.price));

  const todayForecast = forecastData[0] || {
    tempAvg: 28,
    tempMin: 22,
    rainfallMm: 0.0,
    rainProbability: 10,
    condition: 'Clear Sky',
    windSpeed: 12
  };

  const STAGE_PROGRESS = {
    'Initial / Germination': '10%',
    'Vegetative': '30%',
    'Flowering': '60%',
    'Yield Formation / Fruiting': '85%',
    'Ripening / Harvesting': '100%',
  };
  const progressPct = STAGE_PROGRESS[farm?.growthStage] || '30%';

  const currentCropRec = cropRecommendations.find(
    (r) => r.crop.toLowerCase() === (farm?.currentCrop || 'wheat').toLowerCase()
  );
  const cropMatchScore = currentCropRec ? `${currentCropRec.score}%` : '95%';
  const cropMatchText = currentCropRec ? 'Optimal Soil Match' : 'NPK Baselines Fit';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* ======================================================== */}
      {/* 1. DASHBOARD HEADER */}
      {/* ======================================================== */}
      <div className="relative bg-white/90 backdrop-blur-md text-slate-900 p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-emerald-100/90 overflow-hidden">
        {/* Soft background glow accents */}
        <div className="absolute top-0 right-0 from-emerald-200/30 to-green-100/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
              <span className="flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3.5 py-1.5 rounded-full border border-slate-200/80">
                <MapPin size={13} className="text-emerald-600" />
                {farm?.location?.display || 'Indore, Madhya Pradesh'}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3.5 py-1.5 rounded-full border border-slate-200/80">
                <Calendar size={13} className="text-emerald-600" />
                {currentDateStr}
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full border border-emerald-200/80 font-extrabold">
                <Sprout size={14} className="text-emerald-600" />
                Vegetative
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Good Morning, {user?.name || 'Farmer'} 👋
            </h1>

            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 inline-flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1 text-emerald-800 font-bold">
                <Sprout size={15} className="text-emerald-600" /> Active Crop:
              </span>
              <strong className="text-slate-900 font-extrabold">
                {farm?.currentCrop || 'Wheat'}
              </strong>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Stage:{' '}
                <strong className="text-slate-900">{farm?.growthStage || 'Vegetative'}</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Land:{' '}
                <strong className="text-slate-900">
                  {farm?.landSize?.value || 5} {farm?.landSize?.unit || 'Acres'}
                </strong>{' '}
                ({farm?.soilType || 'Black Soil'})
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-2xl transition-all text-slate-700 flex items-center gap-2 text-xs font-bold border border-slate-200/80 cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>

            {/* Notifications Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-2xl transition-all text-slate-700 relative border border-slate-200/80 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white text-slate-900 rounded-3xl p-4 shadow-2xl border border-emerald-100 z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Bell size={14} className="text-emerald-600" /> Active Farm Alerts
                    </span>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="font-bold text-emerald-900">Weather Risk: Clear</p>
                      <p className="text-slate-600 text-[11px]">
                        No rainfall risk forecasted for next 48 hrs.
                      </p>
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="font-bold text-amber-900">Mandi Price Spike</p>
                      <p className="text-slate-600 text-[11px]">
                        Wheat market price rose +4.2% this week.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ask AI Voice */}
            <Link
              to="/voice-assistant"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl transition flex items-center gap-2 shadow-md text-xs"
            >
              <Mic className="w-4 h-4" />
              Ask AI Assistant
            </Link>

            {/* Farm Profile Setup */}
            <Link
              to="/farm-profile"
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition text-xs border border-slate-200"
            >
              Farm Setup
            </Link>
          </div>
        </div>
      </div>

      {/* Proactive Farmer Today's Priority Operations Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-extrabold flex items-center gap-1.5">
              Today's Agronomic Priorities & Insights
            </p>
            <p className="text-white/80 text-xs mt-0.5 font-medium leading-relaxed">
              Pest warning reported 2.4km away • Crop vegetative growth progress is normal • Weather
              suitable for fertilizer application.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/crop-health"
            className="px-3.5 py-1.5 bg-white text-emerald-800 font-extrabold rounded-xl transition hover:bg-slate-50 text-xs shrink-0"
          >
            Disease Guard
          </Link>
          <Link
            to="/irrigation"
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 border border-white/20 text-white font-extrabold rounded-xl transition text-xs shrink-0"
          >
            Water Schedule
          </Link>
        </div>
      </div>

      {/* API Error Notification Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-rose-600" size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Community Alert Bar */}
      {communityAlert?.active && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900">{communityAlert.title}</span>
              <span className="text-xs text-amber-700 font-semibold">
                {communityAlert.distanceKm} km away • {communityAlert.reportsCount} reports
              </span>
            </div>
            <p className="text-amber-800 mt-1 text-xs">{communityAlert.message}</p>
            <p className="text-amber-900 font-bold mt-1 text-xs">💡 {communityAlert.recommended}</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. KPI SUMMARY CARDS GRID (6 Cards) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* KPI 1: Temperature */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Temperature
            </span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Thermometer size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{todayForecast.tempAvg || 28}°C</p>
            <span className="text-[11px] font-semibold text-slate-500">
              {todayForecast.condition || 'Clear Sky'} • {todayForecast.tempMin || 22}° Min
            </span>
          </div>
        </div>

        {/* KPI 2: Rainfall */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Rainfall
            </span>
            <div className="p-2 bg-cyan-100 text-cyan-600 rounded-xl group-hover:scale-105 transition-transform">
              <CloudRain size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{todayForecast.rainfallMm || 0.0} mm</p>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {todayForecast.rainProbability || 0}% Rain Chance
            </span>
          </div>
        </div>

        {/* KPI 3: Market Price */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Market Price
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              {market?.currentPrice ? `₹${market.currentPrice}` : 'N/A'}
            </p>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              {market?.changePercent !== undefined && <ArrowUpRight size={13} />}
              <span>
                {farm?.currentCrop || 'Wheat'} {market?.changePercent !== undefined ? `(+${market.changePercent}%)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Crop Recommendation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Crop Match
            </span>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-105 transition-transform">
              <Sprout size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{cropMatchScore}</p>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {cropMatchText}
            </span>
          </div>
        </div>

        {/* KPI 5: Crop Stage */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Crop Stage
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <Sprout size={18} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 truncate">
              {farm?.growthStage || 'Vegetative'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: progressPct }} />
              </div>
              <span className="text-[9px] font-semibold text-slate-500 ml-1">{progressPct} Progress</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Weather Risk Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Weather Risk
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <p className={`text-2xl font-black ${weatherAlert?.hasRisk ? 'text-rose-700' : 'text-emerald-700'}`}>
              {weatherAlert?.hasRisk ? 'Risk Alert' : 'Good (Safe)'}
            </p>
            <span className="text-[11px] font-semibold text-slate-500">
              {weatherAlert?.risks?.[0] || 'No severe alerts'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Database Diagnostics & Telemetry stats */}
      {dashboardData?.stats && (
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
              Real-time Database Diagnostics
            </span>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Live KrishiMitra Telemetry & Faceted Statistics
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Farms</span>
              <p className="text-xl font-black text-slate-950 mt-1">{dashboardData.stats.totalFarms}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Farmers</span>
              <p className="text-xl font-black text-slate-950 mt-1">{dashboardData.stats.totalFarmers}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Healthy Scans</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{dashboardData.stats.healthyCrops}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Diseased Scans</span>
              <p className="text-xl font-black text-rose-600 mt-1">{dashboardData.stats.diseasedCrops}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Irrigations</span>
              <p className="text-xl font-black text-blue-600 mt-1">{dashboardData.stats.totalIrrigationEvents}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Weather Records</span>
              <p className="text-xl font-black text-slate-950 mt-1">{dashboardData.stats.totalWeatherForecasts}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Market Records</span>
              <p className="text-xl font-black text-emerald-800 mt-1">{dashboardData.stats.marketRecords}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue Predict</span>
              <p className="text-xl font-black text-slate-950 mt-1">₹{dashboardData.stats.revenueAnalytics.toLocaleString()}</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Water Usage</span>
              <p className="text-xl font-black text-blue-800 mt-1">{dashboardData.stats.waterUsage.toLocaleString()} L</p>
            </div>
            <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center col-span-2 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Yield Prediction</span>
              <p className="text-xl font-black text-emerald-700 mt-1">{dashboardData.stats.yieldPrediction.toLocaleString()} Q</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. WEATHER ANALYTICS & FORECAST */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weather Trend Line Chart */}
        <div className="lg:col-span-7 min-w-0 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">
                Micro-Climate Telemetry
              </span>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-600" />
                7-Day Weather Trend Analytics
              </h3>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setWeatherMetric('temp')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  weatherMetric === 'temp'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Temp (°C)
              </button>
              <button
                onClick={() => setWeatherMetric('rain')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  weatherMetric === 'rain'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rain (%)
              </button>
              <button
                onClick={() => setWeatherMetric('humidity')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  weatherMetric === 'humidity'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Humidity (%)
              </button>
            </div>
          </div>

          {/* Recharts Weather Line Chart */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                {weatherMetric === 'temp' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="tempMax"
                      stroke="#EF4444"
                      strokeWidth={2.5}
                      name="Max Temp (°C)"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tempAvg"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      name="Avg Temp (°C)"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tempMin"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      name="Min Temp (°C)"
                      dot={{ r: 4 }}
                    />
                  </>
                )}
                {weatherMetric === 'rain' && (
                  <Line
                    type="monotone"
                    dataKey="rainProbability"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    name="Rain Probability (%)"
                    dot={{ r: 4 }}
                  />
                )}
                {weatherMetric === 'humidity' && (
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    name="Relative Humidity (%)"
                    dot={{ r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Forecast Cards */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">7-Day Local Forecast</h3>
            <Link to="/weather" className="text-xs font-bold text-emerald-700 hover:underline">
              Detailed Forecast &rarr;
            </Link>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-64 no-scrollbar pr-1">
            {forecastData.map((f, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl flex items-center justify-between text-xs transition-all ${
                  idx === 0
                    ? 'bg-emerald-50 border border-emerald-200 font-bold text-emerald-900 shadow-sm'
                    : 'bg-slate-50/70 border border-slate-100 text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 font-extrabold">{f.day}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{f.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-600">{f.condition || 'Clear'}</span>
                  <span className="font-extrabold text-slate-900">{f.tempAvg || f.tempMax}°C</span>
                  <span className="text-[10px] font-extrabold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                    💧 {f.rainProbability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MARKET PRICE ANALYTICS & 5. CROP PRICE COMPARISON */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Market Price Line Chart */}
        <div className="lg:col-span-7 min-w-0 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                Mandi Analytics
              </span>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Market Price Trend ({selectedCrop})
              </h3>
            </div>

            {/* Crop Selector Dropdown + Period Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="Wheat">Wheat</option>
                <option value="Rice">Rice</option>
                <option value="Maize">Maize</option>
                <option value="Soybean">Soybean</option>
                <option value="Cotton">Cotton</option>
                <option value="Mustard">Mustard</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {['7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={`px-2.5 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                      selectedPeriod === p
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recharts Market Line Chart */}
          <div className="h-64 w-full pt-2">
            {marketHistoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={marketHistoryData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      color: '#FFF',
                      borderRadius: '16px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Mandi Rate (₹/Quintal)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-semibold">
                No market analytics data available.
              </div>
            )}
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
            <span>
              Market Selling Insight: Prices for {selectedCrop} are trending upward over recent
              intervals.
            </span>
            <Link
              to="/market"
              className="font-extrabold text-emerald-700 hover:underline shrink-0 ml-2"
            >
              Full Mandi Feeds &rarr;
            </Link>
          </div>
        </div>

        {/* MongoDB Aggregation Analytics Charts */}
        <div className="lg:col-span-5 min-w-0 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                MongoDB faceted aggregations
              </span>
              <h3 className="text-base font-bold text-slate-900">Database Analytics History</h3>
            </div>
            
            {/* Period selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
              {['weekly', 'monthly', 'yearly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`px-2 py-0.5 rounded-lg capitalize transition-all cursor-pointer ${
                    analyticsPeriod === p
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Water usage bar chart */}
            <div>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Aggregated Water Usage (mm)
              </span>
              <div className="h-28 w-full">
                {analyticsData?.waterUsage && analyticsData.waterUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.waterUsage} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 7, fill: '#64748B', fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 7, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '8px' }} />
                      <Bar dataKey="totalWaterMm" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Water (mm)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                    No water usage events in this range
                  </div>
                )}
              </div>
            </div>

            {/* Crop Health stacked bar chart */}
            <div>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Aggregated Leaf Diagnostic Scans
              </span>
              <div className="h-28 w-full">
                {analyticsData?.cropHealth && analyticsData.cropHealth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.cropHealth} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 7, fill: '#64748B', fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 7, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '8px' }} />
                      <Bar dataKey="healthyCount" stackId="a" fill="#10b981" name="Healthy" />
                      <Bar dataKey="diseasedCount" stackId="a" fill="#ef4444" name="Diseased" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                    No leaf health reports in this range
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. CROP RECOMMENDATION ANALYTICS & 7. AI SMART INSIGHTS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Crop Recommendation Cards */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                NPK & Climate Matching
              </span>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" />
                AI Crop Suitability Recommendations
              </h3>
            </div>
            <Link
              to="/crop-recommendation"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Engine Settings &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                crop: 'Soybean',
                score: 95,
                season: 'Kharif (Monsoon)',
                soil: 'Black Soil',
                reason: 'High clay retention matches current precipitation index.',
              },
              {
                crop: 'Wheat (Sharbati)',
                score: 98,
                season: 'Rabi (Winter)',
                soil: 'Black / Alluvial',
                reason: 'Optimal temperature window for high protein grain formation.',
              },
              {
                crop: 'Hybrid Maize',
                score: 88,
                season: 'Kharif',
                soil: 'Loamy Soil',
                reason: 'Strong NPK uptake response with moderate water demand.',
              },
            ].map((rec, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="font-extrabold text-sm text-slate-900">{rec.crop}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {rec.season}
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {rec.score}% Match
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${rec.score}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 font-medium">💡 {rec.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Smart Insights */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-extrabold text-purple-600 uppercase tracking-wider">
              AI Farm Telemetry
            </span>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Smart AI Insights & Explainable Advice
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Weather Insight */}
            <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Sun size={15} className="text-blue-600" /> Weather Insight & Advice
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {todayForecast.condition || 'Clear Sky'} expected today. Rainfall probability is {todayForecast.rainProbability || 0}%.
                <span className="block mt-1 font-bold text-emerald-800">
                  💡 Best farming window: 6 AM to 10 AM.
                </span>
              </p>
            </div>

            {/* Market Insight */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <TrendingUp size={15} className="text-emerald-600" /> Market Price Forecast
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {selectedCrop} mandi rates {market?.trend === 'Rising' ? 'increased' : 'are stable'} {market?.changePercent ? `(+${market.changePercent}%)` : ''} over last 7 days.
                <span className="block mt-1 font-bold text-emerald-800">
                  📈 {market?.sellingInsightText || 'Prices are stable. Monitor rates before selling.'}
                </span>
              </p>
            </div>

            {/* Crop Health Insight */}
            <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <Sprout size={15} className="text-purple-600" /> Crop Health & Nutrition
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Soil moisture is {todaysAction?.decision === 'DONT_IRRIGATE' ? 'adequate' : 'low'} ({100 - (todaysAction?.reasoning?.soilDepletionPct || 50)}%). Diagnostic status is {cropHealth?.possibleIssue || 'Normal'}.
                <span className="block mt-1 font-bold text-emerald-800">
                  🛡️ Action: {cropHealth?.nextAction || 'Regular field scouting recommended.'}
                </span>
              </p>
            </div>

            {/* Farming Action */}
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Droplets size={15} className="text-amber-600" /> Recommended Action
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {todaysAction?.reasoning?.actionableAdvice ||
                  'No irrigation required today. Save pumping costs.'}
                <span className="block mt-1 font-bold text-cyan-800">
                  💧 Estimated Water Saved: {Math.round(5.0 * (farm?.landSize?.value || 5) * 4046.86).toLocaleString()} Liters.
                </span>
              </p>
            </div>
          </div>

          {/* Explainable AI (XAI) & Dynamic Reasonings */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-2">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[12px]">
              <Sparkles size={13} className="text-purple-600" /> Explainable AI Decision Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-semibold text-slate-600 leading-normal">
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500 font-bold">Why:</span> {todaysAction?.reasoning?.summaryText || `Soil moisture depletion is optimal.`}
                </p>
                <p>
                  <span className="text-slate-500 font-bold">Expected Crop Impact:</span> {todaysAction?.decision === 'IRRIGATE' ? 'Replenishes soil root zone to prevent crop moisture stress.' : 'Prevents over-irrigation and root oxygen stress.'}
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  <span className="text-slate-500 font-bold">Confidence Score:</span> {todaysAction?.confidence ? `${(todaysAction.confidence * 100).toFixed(0)}%` : '90%'} based on micro-climatic sensor alignment.
                </p>
                <p>
                  <span className="text-slate-500 font-bold">Operations to Avoid:</span> {todayForecast.windSpeed > 20 ? 'Avoid foliar sprays due to high wind speed.' : 'No operational weather constraints today.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-slate-100">
            <span>Powered by KrishiMitra Telemetry Engine</span>
            <Link to="/voice-assistant" className="text-emerald-700 font-bold hover:underline">
              Ask Voice AI &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. ALERTS, RECENT ACTIVITY & MARKET OVERVIEW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts & Risk Panel */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Active Alerts & Warnings
            </h3>
            <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {/* Weather Alert */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <ShieldCheck size={14} className="text-emerald-600" /> Weather Risk
                </span>
                <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded-md text-emerald-950 font-extrabold">
                  NORMAL
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                No heavy rain or frost warnings detected for your location today.
              </p>
            </div>

            {/* Mandi Price Alert */}
            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-blue-800">
                  <TrendingUp size={14} className="text-blue-600" /> Market Price Spike
                </span>
                <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded-md text-blue-900 font-extrabold">
                  INFO
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Wheat market price in Indore mandi rose by +4.2% over last 7 days.
              </p>
            </div>

            {/* Farming Alert */}
            <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-purple-800">
                  <Info size={14} className="text-purple-600" /> Growth Stage Alert
                </span>
                <span className="text-[10px] bg-purple-200 px-2 py-0.5 rounded-md text-purple-900 font-extrabold">
                  ACTION
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Crop in Vegetative stage. Review fertilizer top-dressing schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Recent Telemetry Activity
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Synced</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-extrabold text-slate-900">Micro-climate Telemetry Synced</p>
                <p className="text-[11px] text-slate-500">
                  Open-Meteo weather forecast refreshed • 10m ago
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-extrabold text-slate-900">Mandi Price Feed Updated</p>
                <p className="text-[11px] text-slate-500">
                  Benchmark prices synced for Wheat & Soybean • 1h ago
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-extrabold text-slate-900">Irrigation Decision Evaluated</p>
                <p className="text-[11px] text-slate-500">
                  Irrigation Engine: DON'T IRRIGATE • Today
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-extrabold text-slate-900">Farm Coordinates Verified</p>
                <p className="text-[11px] text-slate-500">
                  Location: {farm?.location?.display || 'Indore, MP'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Overview Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Market Overview
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="text-slate-500 font-bold">Top Performing Commodity</span>
              <span className="font-black text-emerald-700">Cotton (₹6,800/q)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="text-slate-500 font-bold">Your Crop Benchmark</span>
              <span className="font-black text-slate-900">
                {farm?.currentCrop || 'Wheat'} (₹{market?.currentPrice || 2450}/q)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="text-slate-500 font-bold">Highest Market Rate</span>
              <span className="font-black text-slate-900">₹{topCropPrice} / Quintal</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
              <span className="text-slate-500 font-bold">7-Day Price Trend</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                ↑ +{market?.changePercent || 4.2}% Rising
              </span>
            </div>
          </div>

          <Link to="/market" className="w-full">
            <Button variant="secondary" size="sm" fullWidth className="font-bold text-xs">
              Go to Market Intelligence &rarr;
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
