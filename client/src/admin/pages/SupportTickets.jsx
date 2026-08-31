import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Search, UserCheck, MessageSquare, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inspector Modal state
  const [showInspector, setShowInspector] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  
  // Assign state
  const [assigneeId, setAssigneeId] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/tickets', {
        params: {
          page,
          status,
          priority,
          category,
          search,
          limit: 10,
        },
      });
      if (res.data?.success) {
        setTickets(res.data.data.tickets);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await adminApi.get('/tickets/staff/list');
      if (res.data?.success) {
        setStaff(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, status, priority, category]);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const openInspector = (ticket) => {
    setSelectedTicket(ticket);
    setAssigneeId(ticket.assignedTo?._id || '');
    setCommentText('');
    setShowInspector(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const toastId = toast.loading('Assigning support executive...');
    try {
      const res = await adminApi.patch(`/tickets/${selectedTicket._id}/assign`, {
        assignedToId: assigneeId,
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Ticket assigned successfully!', { id: toastId });
        setShowInspector(false);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed', { id: toastId });
    }
  };

  const handleResolve = async (newStatus) => {
    if (!selectedTicket) return;
    const toastId = toast.loading(`Changing ticket status to ${newStatus}...`);
    try {
      const res = await adminApi.patch(`/tickets/${selectedTicket._id}/resolve`, {
        status: newStatus,
      });
      if (res.data?.success) {
        toast.success(`Ticket status changed to ${newStatus}`, { id: toastId });
        setShowInspector(false);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed', { id: toastId });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    const toastId = toast.loading('Posting reply comment...');
    try {
      const res = await adminApi.post(`/tickets/${selectedTicket._id}/comments`, {
        message: commentText,
      });
      if (res.data?.success) {
        toast.success('Comment reply posted successfully', { id: toastId });
        setCommentText('');
        // Refresh selected ticket detail
        const ticketRes = await adminApi.get(`/tickets/${selectedTicket._id}`);
        if (ticketRes.data?.success) {
          setSelectedTicket(ticketRes.data.data);
        }
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Comment failed', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Support Helpdesk</h1>
        <p className="text-xs text-slate-500 mt-1">Resolve farmer feedback, allocate assignments, and view ticket threads.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between shadow-sm text-xs">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by ticket ID or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
              <Search size={14} />
            </span>
          </form>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Priority */}
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Categories</option>
            <option value="weather">Weather</option>
            <option value="irrigation">Irrigation</option>
            <option value="crop_health">Crop Health</option>
            <option value="market">Market Price</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          onClick={fetchTickets}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer text-xs"
        >
          <RefreshCw size={13} />
          Reload
        </button>
      </div>

      {/* Grid List of Tickets */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Querying support queues...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200/80 rounded-2xl shadow-sm px-4">
          <p className="text-slate-405 text-sm font-bold">No Data Available Yet</p>
          <p className="text-slate-400 text-xs mt-1">Queries submitted by farmers will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => openInspector(t)}
              className="bg-white border border-slate-200/80 hover:border-emerald-500/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between space-y-4 group animate-in fade-in"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-1">
                <div className="space-y-1">
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold font-mono px-2 py-0.5 rounded border border-slate-150">
                    {t.ticketId}
                  </span>
                  <h3 className="font-bold text-slate-800 text-xs mt-1.5 group-hover:text-emerald-650 transition-colors">
                    {t.subject}
                  </h3>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    t.priority === 'high' ? 'bg-red-500 text-white border-red-400' : t.priority === 'medium' ? 'bg-amber-500 text-white border-amber-450' : 'bg-slate-400 text-white border-slate-350'
                  }`}>
                    {t.priority}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    t.status === 'resolved' ? 'bg-emerald-600 text-white border-emerald-500' : t.status === 'in_progress' ? 'bg-amber-600 text-white border-amber-500' : 'bg-red-500 text-white border-red-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>

              {/* Description body snippet */}
              <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed font-medium">
                {t.description}
              </p>

              {/* Footer metadata */}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400 shrink-0">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block">From: {t.farmerId?.name || 'Deleted User'}</span>
                  <span className="font-medium text-slate-405">Assigned To: {t.assignedTo?.name || 'Unassigned'}</span>
                </div>
                <span className="font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-500 shadow-sm shadow-inner">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Prev Page
          </button>
          <span>
            Page <strong className="text-slate-800">{page}</strong> of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Next Page
          </button>
        </div>
      )}

      {/* Ticket Thread Inspector Modal */}
      {showInspector && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-xl w-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded border border-slate-150">
                  {selectedTicket.ticketId}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">{selectedTicket.subject}</h3>
              </div>
              <button onClick={() => setShowInspector(false)} className="text-slate-400 hover:text-slate-655 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            {/* Content Thread Scroll */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* Ticket details description */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 shadow-xs">
                <span className="font-bold text-slate-405 uppercase tracking-wider block">Farmer Query Description</span>
                <p className="text-slate-700 leading-relaxed font-semibold">{selectedTicket.description}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
                  <span>Category: <strong className="capitalize">{selectedTicket.category}</strong></span>
                  <span>Date: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Assignment Form & Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <form onSubmit={handleAssign} className="space-y-1.5">
                  <label className="font-bold text-slate-455 uppercase tracking-wider block">Assign Executive</label>
                  <div className="flex gap-2">
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Unassigned --</option>
                      {staff.map((member) => (
                        <option key={member._id} value={member._id}>{member.name} ({member.role?.replace('_', ' ').toLowerCase()})</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer shadow-sm shadow-emerald-950/10"
                    >
                      <UserCheck size={14} />
                    </button>
                  </div>
                </form>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-455 uppercase tracking-wider block">Resolve Status</label>
                  <div className="flex gap-2">
                    {selectedTicket.status !== 'resolved' ? (
                      <button
                        onClick={() => handleResolve('resolved')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/10"
                      >
                        <CheckCircle size={14} />
                        <span>Resolve Ticket</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResolve('in_progress')}
                        className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-950/10"
                      >
                        <AlertCircle size={14} />
                        <span>Reopen Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Discussion Comments list */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <MessageSquare size={16} />
                  Executive Discussion Thread
                </h4>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {selectedTicket.comments.length === 0 ? (
                    <p className="text-slate-400 text-xs py-4 text-center italic font-semibold">No response comments registered.</p>
                  ) : (
                    selectedTicket.comments.map((comm) => (
                      <div key={comm._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 shadow-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span className="font-bold text-slate-655">{comm.senderName} ({comm.senderRole?.replace('_', ' ').toLowerCase()})</span>
                          <span>{new Date(comm.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-650 leading-relaxed font-medium">{comm.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Type official reply or team note..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer shadow-sm shadow-emerald-950/10"
                  >
                    Post Reply
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
