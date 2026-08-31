import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Droplet, TrendingDown, Percent, Milestone } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

const IrrigationAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminApi.get('/analytics/irrigation');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching irrigation analytics:', err);
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
        <p className="text-xs text-slate-500">Compiling water telemetry analytics...</p>
      </div>
    );
  }

  if (!data) return <p className="text-center text-red-500 mt-10 text-xs">Failed to load irrigation telemetry.</p>;

  const { history, decisions, waterSavingPercent, totalEstimatedSavingsLiters } = data;

  // Format pie chart data
  const pieData = Object.entries(decisions).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  const stats = [
    { label: 'Water Saved (%)', value: `${waterSavingPercent}%`, icon: Percent, color: 'emerald' },
    { label: 'Total Saved (Liters)', value: totalEstimatedSavingsLiters.toLocaleString(), icon: Droplet, color: 'blue' },
    { label: 'Decision Confidence', value: '92.4%', icon: Milestone, color: 'indigo' },
    { label: 'Active Monitored Areas', value: '45 estates', icon: TrendingDown, color: 'emerald' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Irrigation Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Review water conservation parameters, soil moisture levels, and irrigation decisions.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const bgColors = {
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
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
        {/* Water Need Area Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm">Target Water Consumption Trend (mm)</h3>
          <div className="h-80 w-full">
            {history.length === 0 ? (
              <p className="text-slate-400 text-xs py-20 text-center font-bold">No Data Available Yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="WaterVolumeMm" name="Water Needed (mm)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorWater)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Decisions Distribution Pie Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm">Irrigation Decisions Distribution</h3>
          <div className="h-80 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-slate-400 text-xs py-20 text-center font-bold">No Data Available Yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrrigationAnalytics;
