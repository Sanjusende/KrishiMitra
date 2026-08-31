import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import { motion } from 'framer-motion';
import {
  Users,
  Sprout,
  Activity,
  Droplet,
  CloudSun,
  TrendingUp,
  MessageSquare,
  Shield,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi.get('/analytics/dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Aggregating telemetry analytics...</p>
      </div>
    );
  }

  if (!data) return <p className="text-center text-red-500 font-semibold mt-10 text-sm">Failed to load analytics summary.</p>;

  const { stats, charts, widgets } = data;

  const statCards = [
    { label: 'Total Farmers', value: stats.totalFarmers, icon: Users, color: 'emerald', detail: `${stats.activeFarmers} active` },
    { label: 'Total Farms', value: stats.totalFarms, icon: Sprout, color: 'emerald', detail: 'Cultivated area' },
    { label: 'Crop Scan Audits', value: stats.cropHealthAnalyses, icon: Activity, color: 'cyan', detail: `${stats.diseaseReports} diseased` },
    { label: 'Irrigation Checks', value: stats.irrigationAnalyses, icon: Droplet, color: 'blue', detail: 'Water recommendations' },
    { label: 'Weather Telemetries', value: stats.weatherRequests, icon: CloudSun, color: 'amber', detail: 'Historical fetches' },
    { label: 'Market Prices logs', value: stats.marketRecords || stats.marketRequests || 0, icon: TrendingUp, color: 'indigo', detail: 'Mandi pricing rates' },
    { label: 'Voice Queries log', value: stats.voiceQueries || 0, icon: MessageSquare, color: 'violet', detail: 'AI Assistant calls' },
    { label: 'Unresolved Tickets', value: stats.pendingTickets || 0, icon: AlertTriangle, color: 'red', detail: 'Helpdesk requests' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Smart Farm Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time diagnostics and agricultural metrics from the KrishiMitra ecosystem.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const bgColors = {
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            amber: 'bg-amber-50 text-amber-600 border-amber-100',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            violet: 'bg-violet-50 text-violet-600 border-violet-100',
            red: 'bg-red-50 text-red-600 border-red-100',
          };
          const resolvedColor = bgColors[card.color] || 'bg-slate-50 text-slate-600 border-slate-100';

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{card.value}</h3>
                  <p className="text-[11px] text-slate-450 font-medium">{card.detail}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${resolvedColor} group-hover:scale-105 transition-transform`}>
                  <Icon size={18} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farmer Growth Area Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Farmer Growth Trend</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.farmerGrowth}>
                <defs>
                  <linearGradient id="colorFarmers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                <Area type="monotone" dataKey="Farmers" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFarmers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disease Cases Bar Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Disease Reports Trend</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.diseaseTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                <Bar dataKey="Cases" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crop Pie Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-1">
          <h4 className="font-bold text-slate-800 text-sm">Active Crops Distribution</h4>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.cropAnalytics}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="Farms"
                >
                  {charts.cropAnalytics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Trends Chart */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
          <h4 className="font-bold text-slate-800 text-sm">Mandi Commodity Trends (INR/Quintal)</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.marketTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Wheat" stroke="#10b981" fill="none" strokeWidth={2} />
                <Area type="monotone" dataKey="Rice" stroke="#06b6d4" fill="none" strokeWidth={2} />
                <Area type="monotone" dataKey="Cotton" stroke="#8b5cf6" fill="none" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Logs & Alert Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Security Audits */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              Recent Security Audits
            </h4>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Live Feed</span>
          </div>

          <div className="space-y-3.5">
            {widgets.recentActivities.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">No recent security logging events.</p>
            ) : (
              widgets.recentActivities.map((act) => (
                <div key={act._id} className="flex justify-between items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px]">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700">{act.action}</span>
                    <p className="text-slate-500 font-medium">
                      Module: <span className="font-bold text-emerald-650">{act.module}</span> | Action By: {act.adminEmail}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-slate-400 font-mono block">{new Date(act.createdAt).toLocaleTimeString()}</span>
                    <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                      {act.ipAddress || '127.0.0.1'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts and Top Regions */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-6 lg:col-span-1">
          {/* Active System Warnings */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Active System Warnings
            </h4>
            <div className="space-y-2">
              {widgets.systemAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0 animate-pulse"></span>
                  <span className="text-red-800 font-semibold">{alert.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disease Hotspots */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText size={16} className="text-amber-500" />
              High Risk Disease Regions
            </h4>
            <div className="space-y-2">
              {widgets.highRiskRegions.length === 0 ? (
                <p className="text-slate-400 text-xs py-2 text-center">No disease hotspot analytics found.</p>
              ) : (
                widgets.highRiskRegions.map((region, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-slate-600 font-semibold truncate">{region.region}</span>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {region.count} scans
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
