import React, { useState } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { FileDown, Calendar, FileText, CheckCircle } from 'lucide-react';

const Reports = () => {
  const [module, setModule] = useState('farmers');
  const [format, setFormat] = useState('pdf');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    setDownloading(true);
    const toastId = toast.loading('Compiling data registers...');
    try {
      const res = await adminApi.get('/reports/export', {
        params: {
          module,
          format,
        },
        responseType: 'blob', // Important to handle binaries like PDFs
      });

      // Trigger browser file download
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${module}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report file downloaded successfully', { id: toastId });
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Failed to compile report. Insufficient data or server error.', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const modules = [
    { id: 'farmers', label: 'Registered Farmers', desc: 'Lists names, contact phones, languages, verified flags, and signup dates.' },
    { id: 'crops', label: 'Crop Farm Profiles', desc: 'Includes soil details, growth cycles, seasons, sizes, and coordinates.' },
    { id: 'diseases', label: 'AI Crop Leaf Scans', desc: 'Tracks diagnoses, confidence marks, preventions, and next action advice.' },
    { id: 'irrigation', label: 'Smart Irrigation History', desc: 'Water recommendation volume outputs, rainfall probabilities, and decisions.' },
    { id: 'weather', label: 'Weather Forecast History', desc: 'Regional humidity, UV parameters, heat indices, and storm metrics.' },
    { id: 'market', label: 'Market Mandi Pricing', desc: 'Commodity pricing updates, price trends, and source Mandi details.' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Reports Compiler</h1>
        <p className="text-xs text-slate-500 mt-1">Compile and download analytical reports for crop health, weather forecasts, or market pricing logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Export Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm self-start">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6 shrink-0">
            <FileDown size={18} className="text-emerald-650" />
            Export Settings
          </h2>

          <form onSubmit={handleDownload} className="space-y-6 text-xs">
            {/* Pick Module */}
            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">Target Registers</label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Pick Format */}
            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">File Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="pdf">Adobe PDF (.pdf)</option>
                <option value="csv">Comma Separated Values (.csv)</option>
                <option value="excel">Microsoft Excel Sheet (.csv/xls)</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={downloading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 active:scale-98 transition-transform disabled:opacity-50"
            >
              <FileDown size={14} />
              <span>{downloading ? 'Compiling File...' : 'Compile & Download File'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Modules Info Cards */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Modules Available</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((m) => (
              <div key={m.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs shadow-xs">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-650" />
                  {m.label}
                </h4>
                <p className="text-slate-450 leading-relaxed font-medium">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
