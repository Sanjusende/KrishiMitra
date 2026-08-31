import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Search, Eye, AlertOctagon, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [confirmAction, setConfirmAction] = useState(''); // 'suspend' | 'activate' | 'delete'

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/farmers', {
        params: {
          page,
          search,
          status,
          limit: 10,
        },
      });
      if (res.data?.success) {
        setFarmers(res.data.data.farmers);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching farmers list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFarmers();
  };

  const openConfirmModal = (farmer, action) => {
    setSelectedFarmer(farmer);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedFarmer) return;
    setShowConfirmModal(false);
    const id = selectedFarmer._id;
    const name = selectedFarmer.name;

    const toastId = toast.loading(`Processing action...`);
    try {
      if (confirmAction === 'suspend') {
        const res = await adminApi.patch(`/farmers/${id}/suspend`);
        if (res.data?.success) {
          toast.success(`Farmer ${name} has been suspended`, { id: toastId });
          fetchFarmers();
        }
      } else if (confirmAction === 'activate') {
        const res = await adminApi.patch(`/farmers/${id}/activate`);
        if (res.data?.success) {
          toast.success(`Farmer ${name} has been activated`, { id: toastId });
          fetchFarmers();
        }
      } else if (confirmAction === 'delete') {
        const res = await adminApi.delete(`/farmers/${id}`);
        if (res.data?.success) {
          toast.success(`Farmer ${name} deleted successfully`, { id: toastId });
          fetchFarmers();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Farmer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Review profiles, deactivations, and statistics of all farmers.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative flex">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <button type="submit" className="hidden" />
        </form>

        {/* Filter status */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full md:w-44 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Querying farmer records...</p>
          </div>
        ) : farmers.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-slate-400 text-sm font-bold">No Data Available Yet</p>
            <p className="text-slate-400 text-xs mt-1">outbreak alerts will appear here when farmers register in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-center">Farms</th>
                  <th className="p-4 text-center">Verified</th>
                  <th className="p-4">Language</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {farmers.map((farmer) => (
                  <tr key={farmer._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">
                      {farmer.name}
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-700">{farmer.email}</p>
                        <p className="text-slate-400 text-xs">{farmer.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700">
                      {farmer.farmCount}
                    </td>
                    <td className="p-4 text-center">
                      {farmer.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-650 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-100">
                          No
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-650">{farmer.language || 'EN'}</td>
                    <td className="p-4">
                      {farmer.isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-605 px-2 py-0.5 rounded-full font-bold border border-red-100">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-650 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/farmers/${farmer._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                          title="View Profile Details"
                        >
                          <Eye size={16} />
                        </Link>
                        {farmer.isSuspended ? (
                          <button
                            onClick={() => openConfirmModal(farmer, 'activate')}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 cursor-pointer"
                            title="Activate Account"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openConfirmModal(farmer, 'suspend')}
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 cursor-pointer"
                            title="Suspend Account"
                          >
                            <AlertOctagon size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openConfirmModal(farmer, 'delete')}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500 shadow-inner">
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
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <ShieldAlert size={28} />
              <h3 className="text-lg font-bold text-slate-800">Confirm Operation</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Are you sure you want to <strong className="capitalize">{confirmAction}</strong> farmer{' '}
              <strong>{selectedFarmer?.name}</strong>?
              {confirmAction === 'delete' && ' This will also delete all associated farm data and profiles permanently.'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer ${
                  confirmAction === 'delete' ? 'bg-red-650 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farmers;
