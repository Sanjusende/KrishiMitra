import React, { useEffect, useState } from 'react';
import adminApi from '../services/adminApi';
import { Search, Shield, Eye, Calendar, RefreshCw } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inspector Modal
  const [showInspector, setShowInspector] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/audit-logs', {
        params: {
          page,
          action,
          module: moduleFilter,
          limit: 15,
        },
      });
      if (res.data?.success) {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, moduleFilter]);

  const openInspector = (log) => {
    setSelectedLog(log);
    setShowInspector(true);
  };

  const modules = ['AUTH', 'FARMER', 'FARM', 'DISEASE', 'NOTIFICATION', 'SCHEME', 'TICKET', 'REPORT', 'SETTINGS'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Security Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">Review chronological operations history, user status toggles, and login entries.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm text-xs">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-850 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Action Filter */}
          <input
            type="text"
            placeholder="Filter by action (e.g. LOGIN)..."
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="w-full sm:w-52 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer text-xs"
        >
          <RefreshCw size={13} />
          Refresh feed
        </button>
      </div>

      {/* Table grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Querying security registers...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-slate-405 text-sm font-bold">No Data Available Yet</p>
            <p className="text-slate-400 text-xs mt-1">Audit log records of system activity will populate here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-4">Admin Agent</th>
                  <th className="p-4">Operation Action</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800">{log.adminId?.name || 'System Auto'}</p>
                        <p className="text-slate-450 text-[10px] font-medium">{log.adminEmail}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-emerald-600">{log.module}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-500 font-medium">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="p-4 text-slate-400 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openInspector(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                        title="View Detailed Payload"
                      >
                        <Eye size={15} />
                      </button>
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

      {/* Raw Payload Inspector Modal */}
      {showInspector && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl shadow-2xl relative flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Shield size={16} className="text-emerald-600" />
                Audit Detail Inspector
              </h3>
              <button onClick={() => setShowInspector(false)} className="text-slate-400 hover:text-slate-655 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Operation Action</span>
                  <span className="font-bold text-slate-800">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Module Component</span>
                  <span className="font-bold text-slate-800">{selectedLog.module}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Admin User</span>
                <span className="font-semibold text-slate-700">{selectedLog.adminEmail}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Payload Metadata</span>
                <pre className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-150 text-[10px] font-mono text-slate-650 overflow-x-auto shadow-xs">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
