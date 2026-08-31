import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import { Search, Eye, Calendar, User, Sprout, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const CropHealth = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState('');
  const [crop, setCrop] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inspector Modal
  const [showInspector, setShowInspector] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/crop-health', {
        params: {
          page,
          health,
          crop,
          limit: 9, // Grid of 3x3
        },
      });
      if (res.data?.success) {
        setScans(res.data.data.scans);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching crop health scans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [page, health, crop]);

  const openInspector = (scan) => {
    setSelectedScan(scan);
    setShowInspector(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Crop Health Scans</h1>
        <p className="text-xs text-slate-500 mt-1">Review AI disease diagnoses, leaf scan images, and treatment directions.</p>
      </div>

      {/* Filters Panel */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm text-xs">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={health}
            onChange={(e) => { setHealth(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-850 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Health Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Diseased">Diseased</option>
          </select>

          {/* Crop Search */}
          <div className="relative flex w-full sm:w-56">
            <input
              type="text"
              placeholder="Filter by crop name..."
              value={crop}
              onChange={(e) => { setCrop(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
              <Search size={14} />
            </span>
          </div>
        </div>

        <button
          onClick={fetchScans}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer text-xs"
        >
          <RefreshCw size={13} />
          Reload List
        </button>
      </div>

      {/* Scans Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Querying Leaf Scans database...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-24 bg-white border border-slate-200/80 rounded-2xl px-4 shadow-sm">
          <p className="text-slate-405 text-sm font-bold">No Data Available Yet</p>
          <p className="text-slate-400 text-xs mt-1">Leaves diagnosed by farmers will populate here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scans.map((scan) => (
            <div
              key={scan._id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Leaf Image Card */}
              <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={scan.imageUrl}
                  alt="Farmer Crop leaf scan"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow border ${
                    scan.health === 'Diseased' ? 'bg-red-500 text-white border-red-400' : 'bg-emerald-600 text-white border-emerald-500'
                  }`}>
                    {scan.health || 'Diagnosed'}
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-bold text-slate-800 text-xs">
                      {scan.disease || scan.possibleIssue || 'Healthy Leaf'}
                    </h3>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold font-mono">
                      Conf: {scan.confidence}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    <strong>Next Action:</strong> {scan.nextAction}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      <Sprout size={12} className="text-emerald-600" />
                      Crop: {scan.crop || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-505">
                      <User size={12} className="text-slate-400" />
                      Farmer: {scan.farmId?.userId?.name || 'Deleted User'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => openInspector(scan)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-slate-150"
                  >
                    <Eye size={12} />
                    Inspect
                  </button>
                </div>
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

      {/* AI Diagnoses Inspector Modal */}
      {showInspector && selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 max-w-2xl w-full rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-800">AI Diagnoses Scanner Details</h3>
              <button onClick={() => setShowInspector(false)} className="text-slate-400 hover:text-slate-655 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                  <img
                    src={selectedScan.imageUrl}
                    alt="Inspection Leaf"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Analysis detail */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Diagnosis result</span>
                    <h4 className="text-base font-bold text-slate-800 mt-1">
                      {selectedScan.disease || selectedScan.possibleIssue || 'Healthy Leaf'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Health Rating</span>
                      <span className={`font-bold text-xs ${selectedScan.health === 'Diseased' ? 'text-red-500' : 'text-emerald-650'}`}>
                        {selectedScan.health || 'Diagnosed'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">Severity Rating</span>
                      <span className="font-bold text-xs text-amber-500">{selectedScan.severity || 'Moderate'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                      <span>AI Model Confidence</span>
                      <span>{selectedScan.confidence}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{
                          width: selectedScan.confidence === 'High' ? '90%' : selectedScan.confidence === 'Moderate' ? '60%' : '30%',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations and Details */}
              <div className="space-y-4 border-t border-slate-150 pt-6">
                {/* Description */}
                {selectedScan.description && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-450 uppercase tracking-wider block">Scan Symptoms Description</span>
                    <p className="text-slate-650 leading-relaxed font-medium">{selectedScan.description}</p>
                  </div>
                )}

                {/* Treatment details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-455 uppercase tracking-wider block">Recommended Treatments</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-650 font-medium">
                      {selectedScan.treatment && selectedScan.treatment.length > 0 ? (
                        selectedScan.treatment.map((t, idx) => <li key={idx}>{t}</li>)
                      ) : (
                        <li>Standard nitrogenous soil balances recommended</li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-455 uppercase tracking-wider block">Preventions</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-650 font-medium">
                      {selectedScan.prevention && selectedScan.prevention.length > 0 ? (
                        selectedScan.prevention.map((p, idx) => <li key={idx}>{p}</li>)
                      ) : (
                        <li>Crop rotation practices advised in Rabi cycles</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Action recommendations */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-1 shadow-xs">
                  <span className="font-bold text-emerald-600 uppercase tracking-wider block">Actionable AI Advice</span>
                  <p className="text-slate-700 leading-relaxed font-semibold">{selectedScan.nextAction}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropHealth;
