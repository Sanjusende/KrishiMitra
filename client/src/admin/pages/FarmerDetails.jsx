import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import adminApi from '../services/adminApi';
import {
  ArrowLeft,
  User,
  Sprout,
  Activity,
  MessageSquare,
  Ticket,
  MapPin,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const FarmerDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('farms');

  useEffect(() => {
    const fetchFarmerDetails = async () => {
      try {
        const res = await adminApi.get(`/farmers/${id}`);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching farmer details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmerDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Retrieving farmer profile details...</p>
      </div>
    );
  }

  if (!data) return <p className="text-center text-red-500 mt-10 text-xs">Failed to load farmer profile details.</p>;

  const { profile, farms, scans, tickets, voiceQueries } = data;

  const tabs = [
    { id: 'farms', label: 'Farms', icon: Sprout, count: farms.length },
    { id: 'scans', label: 'AI Crop Scans', icon: Activity, count: scans.length },
    { id: 'queries', label: 'Voice Queries', icon: MessageSquare, count: voiceQueries.length },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket, count: tickets.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/admin/farmers" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-semibold">
        <ArrowLeft size={16} />
        Back to Farmers Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Profile Snapshot */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm self-start space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-650 font-bold text-3xl flex items-center justify-center border border-emerald-250 mb-4">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
            <div className="mt-2 flex gap-1.5">
              {profile.isSuspended ? (
                <span className="text-[10px] bg-red-50 text-red-655 px-2.5 py-0.5 rounded-full font-bold border border-red-100">
                  Suspended
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-50 text-emerald-650 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100">
                  Active Account
                </span>
              )}
              {profile.isVerified && (
                <span className="text-[10px] bg-blue-50 text-blue-650 px-2.5 py-0.5 rounded-full font-bold border border-blue-100">
                  Verified
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-slate-400 block text-[10px]">Email Address</span>
                <span className="font-semibold text-slate-700 truncate block">{profile.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={16} className="text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Phone Number</span>
                <span className="font-semibold text-slate-700">{profile.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">Joined Date</span>
                <span className="font-semibold text-slate-700">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Tabs and Sub-Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex gap-1 shadow-sm overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm min-h-[40vh]">
            {/* 1. Farms tab */}
            {activeTab === 'farms' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Farms Profiles</h3>
                {farms.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center font-bold">No Data Available Yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {farms.map((farm) => (
                      <div key={farm._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs text-slate-800">{farm.name}</h4>
                            <p className="text-slate-400 text-[10px] flex items-center gap-1 mt-1 font-semibold">
                              <MapPin size={10} />
                              {farm.location?.display}
                            </p>
                          </div>
                          <span className="text-[10px] bg-emerald-50 text-emerald-750 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                            {farm.landSize?.value} {farm.landSize?.unit}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-3">
                          <div>
                            <span className="text-slate-400 block font-semibold">Soil Type</span>
                            <span className="font-bold text-slate-700">{farm.soilType}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">Current Crop</span>
                            <span className="font-bold text-slate-700">{farm.currentCrop} ({farm.season})</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. AI Scans tab */}
            {activeTab === 'scans' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Leaf Scans Audit</h3>
                {scans.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center font-bold">No Data Available Yet</p>
                ) : (
                  <div className="space-y-3">
                    {scans.map((scan) => (
                      <div key={scan._id} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs shadow-xs">
                        <img
                          src={scan.imageUrl}
                          alt="Leaf Scan"
                          className="w-16 h-16 object-cover rounded-lg shrink-0 bg-slate-150 border border-slate-200"
                        />
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{scan.disease || scan.possibleIssue || 'Healthy Leaf'}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scan.health === 'Diseased' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {scan.health || 'Diagnosed'}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] truncate">Next Action: {scan.nextAction}</p>
                          <span className="text-slate-450 text-[10px] block font-mono font-medium">{new Date(scan.reportedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Voice Companion tab */}
            {activeTab === 'queries' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Voice Companion Logs</h3>
                {voiceQueries.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center font-bold">No Data Available Yet</p>
                ) : (
                  <div className="space-y-4">
                    {voiceQueries.map((q) => (
                      <div key={q._id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs shadow-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>Lang: <strong className="uppercase">{q.language}</strong></span>
                          <span>{new Date(q.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-650">Q: "{q.query}"</p>
                          <p className="text-slate-650 mt-1 leading-relaxed">{q.responseText}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Support Tickets tab */}
            {activeTab === 'tickets' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Farmers Support Pipeline</h3>
                {tickets.length === 0 ? (
                  <p className="text-slate-400 text-xs py-8 text-center font-bold">No Data Available Yet</p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((t) => (
                      <Link
                        key={t._id}
                        to={`/admin/tickets`}
                        className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition-colors block text-xs shadow-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700">{t.ticketId} - {t.subject}</span>
                          <p className="text-slate-450 text-[10px] font-medium capitalize">Category: {t.category} | Priority: {t.priority}</p>
                        </div>
                        <div className="text-right space-y-1.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : t.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {t.status}
                          </span>
                          <span className="text-slate-400 text-[10px] block font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDetails;
