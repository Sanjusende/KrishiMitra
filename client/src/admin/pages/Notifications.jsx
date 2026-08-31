import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Send, Bell, Search, Info, HelpCircle } from 'lucide-react';

const Notifications = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    category: 'weather',
    title: '',
    message: '',
    targetType: 'all',
    targetValue: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/notifications', { params: { page, limit: 10 } });
      if (res.data?.success) {
        setBroadcasts(res.data.data.notifications);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching broadcasts log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message || !formData.targetType) return;
    setSubmitting(true);
    const toastId = toast.loading('Dispatching targeted broadcast...');
    try {
      const res = await adminApi.post('/notifications', formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Broadcast alert sent successfully!', { id: toastId });
        setFormData({
          category: 'weather',
          title: '',
          message: '',
          targetType: 'all',
          targetValue: '',
        });
        setPage(1);
        fetchBroadcasts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch broadcast', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetLabel = (type, val) => {
    if (type === 'all') return 'All Farmers';
    return `${type.charAt(0).toUpperCase() + type.slice(1)}: ${val}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Notification Center</h1>
        <p className="text-xs text-slate-500 mt-1">Broadcast weather warnings, crop disease hazards, mandi changes, and scheme announcements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Send Broadcast Alert Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm self-start">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6 shrink-0">
            <Bell size={18} className="text-emerald-650" />
            Send Broadcast Alert
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Category */}
            <div className="space-y-1">
              <label className="font-bold text-slate-450 uppercase tracking-wider block">Alert Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
              >
                <option value="weather">Weather Warnings</option>
                <option value="disease">Disease & Pest Hazards</option>
                <option value="market">Market & Mandi Price Updates</option>
                <option value="scheme">Government Scheme Announcements</option>
              </select>
            </div>

            {/* Target Type */}
            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">Targeting Criteria</label>
              <select
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetValue: '' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
              >
                <option value="all">All Farmers</option>
                <option value="state">State-Wise</option>
                <option value="district">District-Wise</option>
                <option value="crop">Crop-Wise</option>
              </select>
            </div>

            {/* Target Value (Conditional) */}
            {formData.targetType !== 'all' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">
                  Target Value (e.g. {formData.targetType === 'crop' ? 'Wheat' : formData.targetType === 'state' ? 'Madhya Pradesh' : 'Bhopal'})
                </label>
                <input
                  type="text"
                  required
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder={`Enter targeted ${formData.targetType}`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">Alert Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Alert header message..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
              />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">Alert Message Body</label>
              <textarea
                required
                rows="4"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Details crop safety advice or weather description..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10"
            >
              <Send size={14} />
              <span>{submitting ? 'Broadcasting...' : 'Broadcast Alert Message'}</span>
            </button>
          </form>
        </div>

        {/* Right Panel: Past Broadcast Log History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Previous Dispatch History</h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Querying broadcast registers...</p>
              </div>
            ) : broadcasts.length === 0 ? (
              <p className="text-slate-400 text-xs py-10 text-center font-bold">No Data Available Yet</p>
            ) : (
              <div className="space-y-4">
                {broadcasts.map((log) => (
                  <div key={log._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 text-xs shadow-xs">
                    <div className="flex justify-between items-start gap-1">
                      <div className="space-y-0.5">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${
                          log.category === 'weather' ? 'bg-amber-50 text-amber-800 border-amber-100' : log.category === 'disease' ? 'bg-red-50 text-red-800 border-red-100' : log.category === 'market' ? 'bg-indigo-50 text-indigo-800 border-indigo-100' : 'bg-blue-50 text-blue-800 border-blue-100'
                        }`}>
                          {log.category} Alert
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{log.title}</h4>
                      </div>
                      <span className="text-slate-400 text-[10px] font-mono shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>

                    <p className="text-slate-655 leading-relaxed pl-1 text-[11px] font-medium">{log.message}</p>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Target: <strong className="text-slate-600">{getTargetLabel(log.targetType, log.targetValue)}</strong></span>
                      <span>Dispatched by: <strong>{log.senderId?.name || 'Super Admin'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-105 text-xs text-slate-500 shadow-inner">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page <strong className="text-slate-800">{page}</strong> of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
