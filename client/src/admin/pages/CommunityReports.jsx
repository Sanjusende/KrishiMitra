import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Search, ShieldAlert, Calendar, MapPin, RefreshCw } from 'lucide-react';

const CommunityReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get('/community-reports', {
        params: {
          page,
          search,
          limit: 10,
        },
      });
      if (res.data?.success) {
        setReports(res.data.data.reports || []);
        setTotalPages(res.data.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching community reports:', err);
      const errMsg = err.response?.data?.message || 'Failed to connect to database collection';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Community Proximity Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">Review crowd-sourced alerts and disease outbreak clusters reported by nearby farmers.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative flex">
          <input
            type="text"
            placeholder="Search by crop or reported issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <button type="submit" className="hidden" />
        </form>

        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer text-xs"
        >
          <RefreshCw size={13} />
          Reload Outbreaks
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Querying community outbreak reports...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 px-4">
            <ShieldAlert size={36} className="text-red-500 mx-auto mb-3" />
            <p className="text-red-500 text-sm font-semibold">{error}</p>
            <button
              onClick={fetchReports}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs cursor-pointer shadow-md shadow-emerald-900/10"
            >
              Retry Connection
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-slate-405 text-sm font-bold">No Data Available Yet</p>
            <p className="text-slate-400 text-xs mt-1">Outbreak alerts reported by nearby farmers will populate here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-4">Crop Name</th>
                  <th className="p-4">Reported Issue</th>
                  <th className="p-4 text-center">Active Reports Outbreak Count</th>
                  <th className="p-4">Location (Coordinates)</th>
                  <th className="p-4">Proximity Range</th>
                  <th className="p-4 text-right">Last Reported Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-emerald-650">
                      {report.crop}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {report.possibleIssue}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded bg-red-50 text-red-650 border border-red-100 shadow-xs">
                        {report.reportCount} reports
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        ({report.location?.lat?.toFixed(4)}, {report.location?.lng?.toFixed(4)})
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-semibold">
                      {report.nearbyDistanceKm || 2.4} km radius
                    </td>
                    <td className="p-4 text-right text-slate-400 font-mono font-medium">
                      <span className="flex items-center justify-end gap-1">
                        <Calendar size={12} />
                        {new Date(report.lastReportedAt || report.updatedAt).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
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
    </div>
  );
};

export default CommunityReports;
