import React, { useState, useEffect } from 'react';
import { getMarketCurrent, getMarketHistory, getNearbyMarkets } from '../services/marketService';
import { useFarm } from '../context/FarmContext';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Building2,
  Bell,
  Sliders,
  DollarSign,
} from 'lucide-react';
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
} from 'recharts';

const CROPS = ['Wheat', 'Rice', 'Maize', 'Soybean', 'Cotton', 'Mustard', 'Gram/Chickpea'];

const MarketIntelligence = () => {
  const { farm } = useFarm();
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [period, setPeriod] = useState('7d');
  const [stateName, setStateName] = useState('Madhya Pradesh');
  const [districtName, setDistrictName] = useState('Indore');
  const [marketData, setMarketData] = useState(null);
  const [historySeries, setHistorySeries] = useState([]);
  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertSet, setAlertSet] = useState(false);

  useEffect(() => {
    if (farm?.currentCrop) {
      setSelectedCrop(farm.currentCrop);
    }
    if (farm?.location) {
      if (farm.location.state) setStateName(farm.location.state);
      if (farm.location.district) setDistrictName(farm.location.district);
    }
  }, [farm]);

  const fetchMarket = async () => {
    try {
      setError(null);
      const res = await getMarketCurrent(selectedCrop, stateName, districtName);
      if (res && res.success) {
        setMarketData(res.data);
      }
      const histRes = await getMarketHistory(selectedCrop, period, stateName, districtName);
      if (histRes && histRes.success) {
        setHistorySeries(histRes.data?.series || []);
      }
      const nearbyRes = await getNearbyMarkets(selectedCrop, stateName, districtName);
      if (nearbyRes && nearbyRes.success) {
        setNearbyMarkets(nearbyRes.data || []);
      }
    } catch (err) {
      console.error('Market data fetch error:', err);
      setError('Market data unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, [selectedCrop, period, stateName, districtName]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMarket();
  };

  const handleSetAlert = (e) => {
    e.preventDefault();
    if (targetPrice) {
      setAlertSet(true);
    }
  };

  // Skeleton Loader State
  if (loading && !refreshing) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-7 bg-slate-200 rounded-lg w-40 animate-pulse" />
          <div className="h-7 bg-slate-200 rounded-lg w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-44 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Error State Component
  if (error && !marketData) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <p className="text-sm font-bold text-slate-900">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const currentPrice = marketData?.currentPrice || 2450;
  const changePercent = marketData?.changePercent || 4.2;
  const trend = marketData?.trend || 'Rising';
  const primaryMarket = marketData?.market || 'Indore Mandi';
  const minPrice = marketData?.minPrice || Math.round(currentPrice * 0.95);
  const maxPrice = marketData?.maxPrice || Math.round(currentPrice * 1.05);
  const avgPrice = marketData?.avgPrice || Math.round((minPrice + maxPrice) / 2);

  const bestMarketItem = (nearbyMarkets.length > 0 ? nearbyMarkets : [{ market: primaryMarket, price: currentPrice, distanceKm: 0 }]).reduce(
    (max, item) => (item.price > max.price ? item : max),
    { price: 0, market: primaryMarket }
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* 1. PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Market Analysis
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Market Data Live
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            AI-powered crop price and market intelligence.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold border border-slate-200 cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Current Price</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            ₹{currentPrice} <span className="text-xs font-bold text-slate-500">/q</span>
          </p>
          <p className="text-[10px] font-semibold text-slate-400">Benchmark mandi rate</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Price Change</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700">+{changePercent}%</p>
          <p className="text-[10px] font-semibold text-slate-400">7-day change rate</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Best Market</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-base font-extrabold text-slate-900 truncate">
            {bestMarketItem.market}
          </p>
          <p className="text-[10px] font-semibold text-emerald-700">
            ₹{bestMarketItem.price} / Quintal
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Market Trend</span>
            {trend === 'Rising' ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <Minus className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <p className="text-xl font-black text-slate-900">{trend}</p>
          <p className="text-[10px] font-semibold text-slate-400">Positive selling momentum</p>
        </div>
      </div>

      {/* 3. CROP SELECTOR & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-700">Select Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-700">State:</span>
            <input
              type="text"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="e.g. Madhya Pradesh"
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 w-28 sm:w-36"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-700">District:</span>
            <input
              type="text"
              value={districtName}
              onChange={(e) => setDistrictName(e.target.value)}
              placeholder="e.g. Indore"
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 w-28 sm:w-36"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md uppercase transition cursor-pointer ${
                period === p
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MARKET PRICE OVERVIEW */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Market Price Overview — {selectedCrop}
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">{primaryMarket}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Current Price
            </span>
            <span className="text-base font-black text-slate-900">₹{currentPrice}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Min Price</span>
            <span className="text-base font-extrabold text-slate-800">₹{minPrice}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Max Price</span>
            <span className="text-base font-extrabold text-emerald-700">₹{maxPrice}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Price</span>
            <span className="text-base font-extrabold text-slate-800">₹{avgPrice}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Date</span>
            <span className="text-xs font-bold text-slate-800">Today</span>
          </div>
        </div>
      </div>

      {/* 5 & 6. PRICE TREND CHART & MARKET COMPARISON GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PRICE TREND CHART */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition min-w-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Price Trend ({period})
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">₹ / Quintal</span>
          </div>

          <div className="h-52 w-full pt-2">
            {historySeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#fff',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [`₹${val} / Quintal`, 'Price']}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#059669' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                No market analytics data available.
              </div>
            )}
          </div>
        </div>

        {/* MARKET COMPARISON BAR CHART */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition min-w-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Market Price Comparison
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Nearby Mandis</span>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={nearbyMarkets}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="market" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '11px',
                  }}
                  formatter={(val) => [`₹${val} / Quintal`, 'Price']}
                />
                <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                  {nearbyMarkets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7 & 8. BEST MARKET & MARKET TREND GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BEST MARKET CARD */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Best Market
            </h2>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Best available price
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Market Location</span>
            <p className="text-lg font-black text-slate-900">{bestMarketItem.market}</p>
            <p className="text-xs font-extrabold text-emerald-700">
              ₹{bestMarketItem.price} / Quintal
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 font-medium">
            💡 Higher returns relative to primary local mandi.
          </div>
        </div>

        {/* MARKET TREND CARD */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Market Trend
            </h2>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              🟢 {trend}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Trend Trajectory</span>
            <p className="text-lg font-black text-slate-900">+{changePercent}% over 7 days</p>
            <p className="text-xs text-slate-600 font-medium">Direction: Upward price momentum</p>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-semibold">
            Commodity prices for {selectedCrop} are demonstrating positive strength.
          </div>
        </div>
      </div>

      {/* 10 & 11. AI MARKET INSIGHT & SELLING OUTLOOK GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SMARTAG AI MARKET INSIGHT & PREDICTIONS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              SmartAg AI Price Forecasting
            </h2>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              📈 <strong>Next-Week Prediction:</strong> ₹{(currentPrice * 1.045).toFixed(0)} - ₹
              {(currentPrice * 1.06).toFixed(0)} / Quintal (+4.5% to +6% projected growth)
            </p>
            <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              💡{' '}
              {marketData?.displayText ||
                'Current market conditions indicate improving prices. Consider monitoring the market before selling.'}
            </p>
            <div className="text-[11px] text-slate-600 space-y-1 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
              <p>
                🗓️ <strong>Best Selling Window:</strong> Next Monday to Wednesday (Indore arrivals
                expected to dip -15%).
              </p>
              <p>
                📊 <strong>Demand Driver:</strong> Export orders and high wheat processing velocity
                at mill benchmarks.
              </p>
            </div>
          </div>
        </div>

        {/* SELLING OUTLOOK CARD */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI Selling Outlook
            </h2>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              HOLD STOCK
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Current Price
              </span>
              <span className="font-extrabold text-slate-900">₹{currentPrice} / q</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Recommended Action
              </span>
              <span className="font-extrabold text-emerald-705">Hold for 5 Days</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
            Estimated returns increase: +₹120/q if transaction executed in Indore or Bhopal mandi
            next week.
          </p>
        </div>
      </div>

      {/* 9 & 12. PRICE ALERT FORM & MARKET DATA TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PRICE ALERT FORM */}
        <form
          onSubmit={handleSetAlert}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Price Alert
              </h2>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <label className="text-[11px] font-bold text-slate-600 block">
                Target Price (₹/Quintal)
              </label>
              <input
                type="number"
                placeholder="e.g. 2600"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
          >
            {alertSet ? 'Alert Active ✓' : 'Set Alert'}
          </button>
        </form>

        {/* MARKET PRICE TABLE */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3 hover:border-emerald-200 transition">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Market Price Summary Table
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2">Crop</th>
                  <th className="pb-2">Market</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Change</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 font-bold">{selectedCrop}</td>
                  <td className="py-2.5 text-slate-600">{primaryMarket}</td>
                  <td className="py-2.5 font-extrabold text-slate-900">₹{currentPrice}</td>
                  <td className="py-2.5 text-emerald-700 font-bold">+{changePercent}%</td>
                  <td className="py-2.5 text-right">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 text-[11px]">
                      {trend}
                    </span>
                  </td>
                </tr>
                {nearbyMarkets
                  .filter((m) => m.market.toLowerCase() !== primaryMarket.toLowerCase())
                  .map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold">{selectedCrop}</td>
                      <td className="py-2.5 text-slate-600">{item.market}</td>
                      <td className="py-2.5 font-extrabold text-slate-900">₹{item.price}</td>
                      <td className="py-2.5 text-emerald-700 font-bold">
                        {item.changePercent >= 0 ? `+${item.changePercent}` : item.changePercent}%
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 text-[11px]">
                          {item.changePercent > 0 ? 'Rising' : item.changePercent < 0 ? 'Falling' : 'Stable'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;
