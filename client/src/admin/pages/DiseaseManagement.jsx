import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, Database, ShieldAlert, Check } from 'lucide-react';

const DiseaseManagement = () => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [crop, setCrop] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    diseaseName: '',
    crop: '',
    symptoms: '',
    causes: '',
    prevention: '',
    treatment: '',
    recommendedPesticide: '',
    severity: 'Medium',
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/diseases', {
        params: {
          page,
          search,
          crop,
          limit: 10,
        },
      });
      if (res.data?.success) {
        setDiseases(res.data.data.diseases);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching disease knowledge base:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, [page, crop]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDiseases();
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedDisease(null);
    setFormData({
      diseaseName: '',
      crop: '',
      symptoms: '',
      causes: '',
      prevention: '',
      treatment: '',
      recommendedPesticide: '',
      severity: 'Medium',
    });
    setShowModal(true);
  };

  const openEditModal = (disease) => {
    setIsEditing(true);
    setSelectedDisease(disease);
    setFormData({
      diseaseName: disease.diseaseName,
      crop: disease.crop,
      symptoms: disease.symptoms,
      causes: disease.causes ? disease.causes.join(', ') : '',
      prevention: disease.prevention ? disease.prevention.join(', ') : '',
      treatment: disease.treatment ? disease.treatment.join(', ') : '',
      recommendedPesticide: disease.recommendedPesticide || '',
      severity: disease.severity || 'Medium',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditing ? 'Updating disease entry...' : 'Adding disease entry...');
    
    // Parse comma separated strings to arrays
    const formattedData = {
      ...formData,
      causes: formData.causes.split(',').map((x) => x.trim()).filter(Boolean),
      prevention: formData.prevention.split(',').map((x) => x.trim()).filter(Boolean),
      treatment: formData.treatment.split(',').map((x) => x.trim()).filter(Boolean),
    };

    try {
      if (isEditing) {
        const res = await adminApi.put(`/diseases/${selectedDisease._id}`, formattedData);
        if (res.data?.success) {
          toast.success('Disease knowledge base updated successfully', { id: toastId });
          setShowModal(false);
          fetchDiseases();
        }
      } else {
        const res = await adminApi.post('/diseases', formattedData);
        if (res.data?.success) {
          toast.success('Disease added to knowledge base successfully', { id: toastId });
          setShowModal(false);
          fetchDiseases();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed', { id: toastId });
    }
  };

  const openDeleteConfirm = (disease) => {
    setSelectedDisease(disease);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!selectedDisease) return;
    const toastId = toast.loading('Deleting disease entry...');
    try {
      const res = await adminApi.delete(`/diseases/${selectedDisease._id}`);
      if (res.data?.success) {
        toast.success('Disease entry deleted successfully', { id: toastId });
        setShowConfirmDelete(false);
        fetchDiseases();
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Disease Knowledge Base</h1>
          <p className="text-xs text-slate-500 mt-1">Manage definitions, recommended pesticides, and symptoms used by AI diagnostic models.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer animate-in fade-in"
        >
          <Plus size={16} />
          Create Disease Definition
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative flex">
          <input
            type="text"
            placeholder="Search diseases by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <button type="submit" className="hidden" />
        </form>

        {/* Filter crop type */}
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Filter by crop (e.g. Wheat)"
            value={crop}
            onChange={(e) => { setCrop(e.target.value); setPage(1); }}
            className="w-full md:w-48 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Querying disease encyclopedia...</p>
          </div>
        ) : diseases.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-slate-400 text-sm font-bold">No Data Available Yet</p>
            <p className="text-slate-400 text-xs mt-1">Definitions created by agricultural experts will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-4">Disease Name</th>
                  <th className="p-4">Target Crop</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Recommended Pesticide</th>
                  <th className="p-4 max-w-xs">Symptoms</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {diseases.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">
                      {d.diseaseName}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      {d.crop}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        d.severity === 'High' ? 'bg-red-50 text-red-600 border-red-100' : d.severity === 'Medium' ? 'bg-amber-50 text-amber-605 border-amber-105' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 italic font-semibold">
                      {d.recommendedPesticide || 'No pesticide specified'}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-500 font-medium">
                      {d.symptoms}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                          title="Modify Entry"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(d)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Delete Entry"
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
                {isEditing ? 'Modify Disease Entry' : 'Add Disease Entry'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-655 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Disease Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-450 uppercase tracking-wider block">Disease Name</label>
                <input
                  type="text"
                  required
                  value={formData.diseaseName}
                  onChange={(e) => setFormData({ ...formData, diseaseName: e.target.value })}
                  placeholder="e.g. Stem Rust"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              {/* Crop & Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-455 uppercase tracking-wider block">Target Crop</label>
                  <input
                    type="text"
                    required
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                    placeholder="e.g. Wheat"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-455 uppercase tracking-wider block">Severity Level</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Recommended Pesticide */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Recommended Pesticide</label>
                <input
                  type="text"
                  value={formData.recommendedPesticide}
                  onChange={(e) => setFormData({ ...formData, recommendedPesticide: e.target.value })}
                  placeholder="e.g. Propiconazole 25% EC"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              {/* Symptoms */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Symptoms Description</label>
                <textarea
                  required
                  rows="3"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Describe leaf/stem visual symptoms..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none resize-none"
                />
              </div>

              {/* Causes (Comma separated) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Causes (comma separated)</label>
                <input
                  type="text"
                  value={formData.causes}
                  onChange={(e) => setFormData({ ...formData, causes: e.target.value })}
                  placeholder="e.g. Fungal spores, High air humidity"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              {/* Preventions */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Preventions (comma separated)</label>
                <input
                  type="text"
                  value={formData.prevention}
                  onChange={(e) => setFormData({ ...formData, prevention: e.target.value })}
                  placeholder="e.g. Crop rotation, Sowing rust-resistant seeds"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              {/* Treatments */}
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Treatments (comma separated)</label>
                <input
                  type="text"
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  placeholder="e.g. Spraying fungicide, Pruning affected foliage"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-850 focus:outline-none"
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
                  <span>{isEditing ? 'Save Changes' : 'Add Disease'}</span>
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
            <h3 className="text-sm font-bold text-red-650">Delete Disease Entry?</h3>
            <p className="text-slate-500 leading-relaxed font-semibold">
              Are you sure you want to permanently delete disease entry <strong>{selectedDisease?.diseaseName}</strong> from knowledge base?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 font-semibold cursor-pointer"
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

export default DiseaseManagement;
