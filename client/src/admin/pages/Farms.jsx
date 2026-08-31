import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, Sprout, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const Farms = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [soilType, setSoilType] = useState('');
  const [crop, setCrop] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Farmers list for select input in creation modal
  const [farmersList, setFarmersList] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    locationDisplay: '',
    lat: '',
    lng: '',
    state: '',
    district: '',
    village: '',
    landSizeValue: '',
    landSizeUnit: 'acres',
    soilType: 'Unknown/Not sure',
    currentCrop: '',
    growthStage: 'Vegetative',
    season: 'Kharif',
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/farms', {
        params: {
          page,
          search,
          soilType,
          crop,
          limit: 10,
        },
      });
      if (res.data?.success) {
        setFarms(res.data.data.farms);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmersList = async () => {
    try {
      const res = await adminApi.get('/farmers', { params: { limit: 100 } });
      if (res.data?.success) {
        setFarmersList(res.data.data.farmers);
      }
    } catch (err) {
      console.error('Error fetching farmers list:', err);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [page, soilType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFarms();
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      userId: '',
      name: '',
      locationDisplay: '',
      lat: '',
      lng: '',
      state: '',
      district: '',
      village: '',
      landSizeValue: '',
      landSizeUnit: 'acres',
      soilType: 'Unknown/Not sure',
      currentCrop: '',
      growthStage: 'Vegetative',
      season: 'Kharif',
    });
    fetchFarmersList();
    setShowModal(true);
  };

  const openEditModal = (farm) => {
    setIsEditing(true);
    setSelectedFarm(farm);
    setFormData({
      userId: farm.userId?._id || '',
      name: farm.name,
      locationDisplay: farm.location?.display || '',
      lat: farm.location?.lat || '',
      lng: farm.location?.lng || '',
      state: farm.location?.state || '',
      district: farm.location?.district || '',
      village: farm.location?.village || '',
      landSizeValue: farm.landSize?.value || '',
      landSizeUnit: farm.landSize?.unit || 'acres',
      soilType: farm.soilType || 'Unknown/Not sure',
      currentCrop: farm.currentCrop,
      growthStage: farm.growthStage || 'Vegetative',
      season: farm.season || 'Kharif',
    });
    setShowModal(true);
  };

  const openDeleteConfirm = (farm) => {
    setSelectedFarm(farm);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!selectedFarm) return;
    const toastId = toast.loading('Deleting farm profile...');
    try {
      const res = await adminApi.delete(`/farms/${selectedFarm._id}`);
      if (res.data?.success) {
        toast.success('Farm profile deleted successfully', { id: toastId });
        setShowConfirmDelete(false);
        fetchFarms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete operation failed', { id: toastId });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditing ? 'Updating farm profile...' : 'Registering farm profile...');
    try {
      if (isEditing) {
        const res = await adminApi.put(`/farms/${selectedFarm._id}`, formData);
        if (res.data?.success) {
          toast.success('Farm profile updated successfully', { id: toastId });
          setShowModal(false);
          fetchFarms();
        }
      } else {
        const res = await adminApi.post('/farms', formData);
        if (res.data?.success) {
          toast.success('Farm profile registered successfully', { id: toastId });
          setShowModal(false);
          fetchFarms();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed', { id: toastId });
    }
  };

  const soilTypes = [
    'Black Cotton Soil',
    'Red Soil',
    'Alluvial Soil',
    'Clay Soil',
    'Sandy Soil',
    'Loamy Soil',
    'Unknown/Not sure',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Farms Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">Audit crop growth cycles, soil quality parameters and farmer estates.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/10 cursor-pointer"
        >
          <Plus size={16} />
          Register New Farm Profile
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search crop / name */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative flex">
          <input
            type="text"
            placeholder="Search by farm name or crop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <button type="submit" className="hidden" />
        </form>

        {/* Soil Filter */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={soilType}
            onChange={(e) => { setSoilType(e.target.value); setPage(1); }}
            className="w-full md:w-48 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Soils</option>
            {soilTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Querying farm estates...</p>
          </div>
        ) : farms.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-slate-400 text-sm font-bold">No Data Available Yet</p>
            <p className="text-slate-400 text-xs mt-1">Register farm profiles to start tracking crop areas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-4">Farm Details</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Soil Type</th>
                  <th className="p-4">Crop & Season</th>
                  <th className="p-4">Growth Stage</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {farms.map((farm) => (
                  <tr key={farm._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800">{farm.name}</p>
                        <p className="text-slate-400 text-xs truncate max-w-xs">{farm.location?.display}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {farm.userId ? (
                        <div className="space-y-0.5">
                          <Link to={`/admin/farmers/${farm.userId._id}`} className="font-semibold text-emerald-600 hover:underline">
                            {farm.userId.name}
                          </Link>
                          <p className="text-slate-400 text-[11px] font-medium">{farm.userId.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unassigned Farmer</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {farm.landSize?.value} {farm.landSize?.unit}
                    </td>
                    <td className="p-4 text-slate-600">
                      {farm.soilType}
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-650 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100">
                          {farm.currentCrop}
                        </span>
                        <p className="text-slate-400 text-[10px] pl-1 font-mono">{farm.season} cycle</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 text-xs">
                      {farm.growthStage}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(farm)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                          title="Modify Farm Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(farm)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Delete Farm Profile"
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

      {/* CRUD Creation/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? 'Modify Farm Profile' : 'Register New Farm Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Farmer selection (Creation only) */}
              {!isEditing && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Select Farmer</label>
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose registered farmer --</option>
                    {farmersList.map((f) => (
                      <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Farm Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-405 uppercase tracking-wider block">Farm Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Green Meadows Estate"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>

              {/* Location display address */}
              <div className="space-y-1">
                <label className="font-bold text-slate-405 uppercase tracking-wider block">Display Location</label>
                <input
                  type="text"
                  required
                  value={formData.locationDisplay}
                  onChange={(e) => setFormData({ ...formData, locationDisplay: e.target.value })}
                  placeholder="e.g. Raisen Mandi Road, Bhopal, MP"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>

              {/* State / District / Village */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Madhya Pradesh"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Bhopal"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Village</label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="Raisen"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coordinates: Lat / Lng */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="23.2599"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    placeholder="77.4126"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Size & Soil */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 grid grid-cols-2 gap-1.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-405 uppercase tracking-wider block">Land Size</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.landSizeValue}
                      onChange={(e) => setFormData({ ...formData, landSizeValue: e.target.value })}
                      placeholder="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-405 uppercase tracking-wider block">Unit</label>
                    <select
                      value={formData.landSizeUnit}
                      onChange={(e) => setFormData({ ...formData, landSizeUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                    >
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                      <option value="bigha">Bigha</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Soil Type</label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    {soilTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crop details */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Current Crop</label>
                  <input
                    type="text"
                    required
                    value={formData.currentCrop}
                    onChange={(e) => setFormData({ ...formData, currentCrop: e.target.value })}
                    placeholder="Wheat / Soybean"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Growth Cycle</label>
                  <select
                    value={formData.growthStage}
                    onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    <option value="Initial / Germination">Initial / Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Yield Formation / Fruiting">Yield Formation / Fruiting</option>
                    <option value="Ripening / Harvesting">Ripening / Harvesting</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-405 uppercase tracking-wider block">Active Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
                  </select>
                </div>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/10 cursor-pointer"
                >
                  <Check size={14} />
                  <span>{isEditing ? 'Update Profile' : 'Register Profile'}</span>
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
            <h3 className="text-sm font-bold text-red-650">Delete Farm Profile?</h3>
            <p className="text-slate-500 leading-relaxed font-medium">
              Are you sure you want to permanently delete farm profile <strong>{selectedFarm?.name}</strong>? This action is irreversible.
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

export default Farms;
