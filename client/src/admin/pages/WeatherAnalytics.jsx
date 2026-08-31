import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CloudSun, Thermometer, Droplet, CloudRain } from 'lucide-react';

const WeatherAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminApi.get('/analytics/weather');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching weather analytics:', err);
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
        <p className="text-xs text-slate-500">Compiling climate records data...</p>
      </div>
    );
  }

  if (!data) return <p className="text-center text-red-500 mt-10 text-xs">Failed to load weather telemetry.</p>;

  const { trends, regionalStats } = data;

  const stats = [
    { label: 'Avg temperature', value: `${regionalStats.avgGlobalTemp}°C`, icon: Thermometer, color: 'amber' },
    { label: 'Avg humidity', value: `${regionalStats.avgGlobalHumidity}%`, icon: Droplet, color: 'blue' },
    { label: 'Total rainfall (mm)', value: `${regionalStats.totalGlobalRainfallMm} mm`, icon: CloudRain, color: 'cyan' },
    { label: 'Climate status', value: 'Moderate Rabi', icon: CloudSun, color: 'emerald' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Weather Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Review climate sensor records, temperature variations, and historical rainfall indexes.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const bgColors = {
            amber: 'bg-amber-50 text-amber-655 border-amber-100',
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Humidity Area Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Temperature & Humidity Trends</h3>
          <div className="h-80 w-full">
            {trends.length === 0 ? (
              <p className="text-slate-400 text-xs py-20 text-center font-bold">No Data Available Yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="Temperature" stroke="#f59e0b" fill="none" strokeWidth={2} />
                  <Area type="monotone" dataKey="Humidity" stroke="#3b82f6" fill="none" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rainfall Bar Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Precipitation Levels (mm)</h3>
          <div className="h-80 w-full">
            {trends.length === 0 ? (
              <p className="text-slate-400 text-xs py-20 text-center font-bold">No Data Available Yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Rainfall" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAnalytics;
