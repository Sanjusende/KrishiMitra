import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, Award, ExternalLink, Check } from 'lucide-react';

const GovernmentSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    schemeName: '',
    description: '',
    eligibility: '',
    benefits: '',
    applyLink: '',
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/schemes', {
        params: {
          page,
          search,
          limit: 10,
        },
      });
      if (res.data?.success) {
        setSchemes(res.data.data.schemes);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching government schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSchemes();
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedScheme(null);
    setFormData({
      schemeName: '',
      description: '',
      eligibility: '',
      benefits: '',
      applyLink: '',
    });
    setShowModal(true);
  };

  const openEditModal = (scheme) => {
    setIsEditing(true);
    setSelectedScheme(scheme);
    setFormData({
      schemeName: scheme.schemeName,
      description: scheme.description,
      eligibility: scheme.eligibility,
      benefits: scheme.benefits,
      applyLink: scheme.applyLink || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditing ? 'Updating scheme...' : 'Creating scheme...');
    try {
      if (isEditing) {
        const res = await adminApi.put(`/schemes/${selectedScheme._id}`, formData);
        if (res.data?.success) {
          toast.success('Government scheme updated successfully', { id: toastId });
          setShowModal(false);
          fetchSchemes();
        }
      } else {
        const res = await adminApi.post('/schemes', formData);
        if (res.data?.success) {
          toast.success('Government scheme created successfully', { id: toastId });
          setShowModal(false);
          fetchSchemes();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed', { id: toastId });
    }
  };

  const openDeleteConfirm = (scheme) => {
    setSelectedScheme(scheme);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!selectedScheme) return;
    const toastId = toast.loading('Deleting scheme...');
    try {
      const res = await adminApi.delete(`/schemes/${selectedScheme._id}`);
      if (res.data?.success) {
        toast.success('Scheme deleted successfully', { id: toastId });
        setShowConfirmDelete(false);
        fetchSchemes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Government Schemes</h1>
          <p className="text-xs text-slate-500 mt-1">Manage directory of state and central subsidy options, eligibility, and portals.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer animate-in fade-in"
        >
          <Plus size={16} />
          Add Government Scheme
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative flex">
          <input
            type="text"
            placeholder="Search schemes by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Querying schemes directory...</p>
          </div>
        ) : schemes.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-slate-400 text-sm font-bold">No Data Available Yet</p>
            <p className="text-slate-400 text-xs mt-1">Government schemes added by team will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-4">Scheme Name</th>
                  <th className="p-4">Eligibility Criteria</th>
                  <th className="p-4">Benefits Summary</th>
                  <th className="p-4">External Portal</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {schemes.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">
                      {s.schemeName}
                    </td>
                    <td className="p-4 text-slate-600 text-xs font-semibold">
                      {s.eligibility}
                    </td>
                    <td className="p-4 text-slate-600 text-xs font-semibold">
                      {s.benefits}
                    </td>
                    <td className="p-4">
                      {s.applyLink ? (
                        <a
                          href={s.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-bold"
                        >
                          <span>Apply Portal</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic font-medium">Offline Application</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                          title="Modify Scheme Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(s)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Delete Scheme"
                        >
                          <Trash2 size={15} />
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

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Modify Government Scheme' : 'Add Government Scheme'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-655 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Scheme Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Scheme Name</label>
                <input
                  type="text"
                  required
                  value={formData.schemeName}
                  onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                  placeholder="e.g. PM Kisan Samman Nidhi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed synopsis of scheme coverage and goals..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none resize-none"
                />
              </div>

              {/* Eligibility */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Eligibility Criteria</label>
                <input
                  type="text"
                  required
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g. Small & marginal farmers, holding less than 2 hectares..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              {/* Benefits */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Benefits Summary</label>
                <input
                  type="text"
                  required
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="e.g. Direct cash subsidy of ₹6,000 annually..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-850 focus:outline-none"
                />
              </div>

              {/* Apply Link */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Apply Portal URL</label>
                <input
                  type="url"
                  value={formData.applyLink}
                  onChange={(e) => setFormData({ ...formData, applyLink: e.target.value })}
                  placeholder="https://pmkisan.gov.in"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check size={14} />
                  <span>{isEditing ? 'Save Scheme' : 'Add Scheme'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-red-650">Delete Government Scheme?</h3>
            <p className="text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to permanently delete scheme <strong>{selectedScheme?.schemeName}</strong> from active directories?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white rounded-xl font-semibold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;
