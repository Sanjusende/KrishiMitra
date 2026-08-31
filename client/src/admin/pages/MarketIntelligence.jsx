import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Landmark, ShieldCheck, HelpCircle } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

const MarketIntelligence = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminApi.get('/analytics/market');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching market analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Compiling market mandi prices telemetry...</p>
      </div>
    );
  }

  if (!data) return <p className="text-center text-red-500 mt-10 text-xs">Failed to load market intelligence.</p>;

  const { recentPrices, cropPriceStats } = data;

  const stats = [
    { label: 'Top Active Commodity', value: cropPriceStats[0]?.crop || 'Wheat', icon: TrendingUp, color: 'emerald' },
    { label: 'Highest Mandi Price', value: `₹${cropPriceStats[0]?.Max || '2,450'}`, icon: Landmark, color: 'indigo' },
    { label: 'Average Price Index', value: `₹${cropPriceStats[0]?.Average || '2,200'}`, icon: ShieldCheck, color: 'blue' },
    { label: 'Monitored Commodities', value: `${cropPriceStats.length} types`, icon: HelpCircle, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Market Intelligence</h1>
        <p className="text-xs text-slate-500 mt-1">Review mandi commodity pricing, transaction records, and average profit bounds.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const bgColors = {
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            amber: 'bg-amber-50 text-amber-655 border-amber-100',
          };
          const resolvedColor = bgColors[stat.color] || 'bg-slate-50 text-slate-655 border-slate-100';

          return (
            <div
              key={stat.label}
              className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{stat.label}</span>
                <span className="text-xl font-bold text-slate-800 tracking-tight">{stat.value}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${resolvedColor}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crop Price Bar Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm">Average Mandi Prices by Commodity (₹/Quintal)</h3>
          <div className="h-80 w-full">
            {cropPriceStats.length === 0 ? (
              <p className="text-slate-400 text-xs py-20 text-center font-bold">No Data Available Yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropPriceStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Average" fill="#10b981" radius={[4, 4, 0, 0]} name="Average Price (₹)" barSize={24} />
                  <Bar dataKey="Max" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Max Price (₹)" barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent mandis prices logs */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-1 flex flex-col h-[400px]">
          <h3 className="font-bold text-slate-800 text-sm shrink-0">Recent Mandi Log Records</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {recentPrices.length === 0 ? (
              <p className="text-slate-400 text-xs py-10 text-center font-bold">No Data Available Yet</p>
            ) : (
              recentPrices.slice(0, 10).map((price) => (
                <div key={price._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center shadow-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700">{price.crop}</span>
                    <p className="text-slate-450 text-[10px] truncate max-w-[155px] font-medium">{price.displayText || 'Benchmark price update'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-650 block">₹{price.currentPrice}</span>
                    <span className="text-slate-400 text-[9px] font-mono font-medium">{price.unit || '₹/Q'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;
