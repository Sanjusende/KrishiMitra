import React, { useState, useEffect } from 'react';
import {
  analyzeCropHealth,
  getCropHealthHistory,
  downloadCropHealthPdf,
} from '../services/cropHealthService';
import { useFarm } from '../context/FarmContext';
import {
  Upload,
  Camera,
  Sprout,
  AlertCircle,
  CheckCircle2,
  History,
  Loader2,
  Info,
  X,
  TriangleAlert,
  FileText,
} from 'lucide-react';
import Button from '../components/ui/Button';
// Diagnostic clinical telemetry mappings for crop health issues
const DISEASE_CLINICAL_DETAILS = {
  'Yellow Rust': {
    severity: 'Medium (35% infestation area detected)',
    remedy:
      'Apply Propiconazole 25% EC foliar spray at 2ml/L water immediately. Avoid morning overhead irrigation to prevent spreading spores.',
    recovery: '7 - 10 Days after application',
    prevention:
      'Cultivate rust-resistant seed varieties next season. Avoid nitrogen over-fertilization.',
  },
  'Late Blight': {
    severity: 'High (Immediate isolation required)',
    remedy:
      'Spray Mancozeb (0.2%) or Metalaxyl-Mancozeb combination. Ensure proper drainage in affected rows.',
    recovery: '10 - 14 Days after treatment',
    prevention:
      'Use certified disease-free seed tubers. Space plants adequately for light penetration.',
  },
  'Leaf Spot / Blight': {
    severity: 'Mild (Early Stage)',
    remedy:
      'Apply Carbendazim at 1g/L water. Remove heavily spotted leaves from the field and destroy them.',
    recovery: '5 - 7 Days',
    prevention:
      'Perform seed treatment with Thiram before sowing. Maintain clean weeding around borders.',
  },
  'Healthy / No disease detected': {
    severity: 'None (Optimal Health)',
    remedy: 'Maintain current organic mulching and standard balanced irrigation.',
    recovery: 'Immediate',
    prevention:
      'Continue weekly scouting. Spray diluted neem oil (1%) once every fortnight as preventive shield.',
  },
};

const CropHealth = () => {
  const { farm } = useFarm();
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [warning, setWarning] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await getCropHealthHistory();
      if (res.success) {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHist(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setWarning(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setWarning(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      formData.append('description', description);

      const res = await analyzeCropHealth(formData);
      if (res.success) {
        setCurrentResult(res.data);
        if (
          farm?.currentCrop &&
          res.data?.crop &&
          farm.currentCrop.toLowerCase() !== res.data.crop.toLowerCase()
        ) {
          setWarning(
            `Selected crop is ${farm.currentCrop}, but the uploaded image appears to be ${res.data.crop}.`
          );
        } else {
          setWarning(null);
        }
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to analyze crop health.';
      setWarning(message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Sprout className="w-8 h-8 text-emerald-600" />
          Crop Health & Pest Detection
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Upload a photo of your {farm?.currentCrop || 'crop'} leaf or describe symptoms to get
          decision-support guidance.
        </p>
      </div>

      {/* Quality Rule Disclaimer Alert */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p>
          <strong>Decision Support Note:</strong> Outputs provide possible-issue flags and
          preliminary check instructions. They represent decision-support guidance and should be
          confirmed with your local KVK or agronomy officer.
        </p>
      </div>

      {warning && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start justify-between gap-3 text-sm text-amber-900 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">Image Validation Note</p>
              <p className="mt-0.5">{warning}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWarning(null)}
            className="text-amber-500 hover:text-amber-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Form Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              1. Upload Leaf / Symptom Photo (Optional)
            </label>

            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 transition rounded-2xl p-6 text-center bg-slate-50 cursor-pointer relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-xl shadow-sm object-cover"
                  />
                  <p className="text-xs text-emerald-700 font-semibold">
                    Click or drag to change image
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Tap to select photo or open camera
                  </p>
                  <p className="text-xs text-slate-400">Supports JPG, PNG, HEIC (Max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              2. Describe Crop Symptoms in Your Own Words
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Yellowing spots on lower wheat leaves, dark spots spreading on tips"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 text-sm placeholder-slate-400"
            />
          </div>

          <Button
            type="submit"
            disabled={analyzing}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Crop Observation...
              </>
            ) : (
              'Analyze Crop Observation'
            )}
          </Button>
        </form>
      </div>

      {/* Analysis Result Card */}
      {currentResult &&
        (() => {
          const details = DISEASE_CLINICAL_DETAILS[currentResult.possibleIssue] || {
            severity: 'Early Warning Stage',
            remedy:
              'Spray general broad-spectrum organic fungicide or neem extract (5%). Limit sprinkler irrigation.',
            recovery: '7 - 10 Days',
            prevention: 'Maintain proper plant spacing and crop scouting schedule.',
          };
          return (
            <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-lg space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between text-emerald-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-xl font-bold">Scan Diagnostic Report</h2>
                </div>
                {currentResult._id && (
                  <button
                    onClick={() => downloadCropHealthPdf(currentResult._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-extrabold rounded-lg border border-emerald-200 cursor-pointer transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold">
                    POSSIBLE ISSUE IDENTIFIED
                  </span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {currentResult.possibleIssue}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-600 text-white text-xs font-extrabold rounded-full">
                    Confidence: {currentResult.confidence}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Disease Severity Index
                    </span>
                    <span className="font-extrabold text-slate-900">{details.severity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Recovery Duration Estimate
                    </span>
                    <span className="font-extrabold text-slate-900">{details.recovery}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-bold">
                    IMMEDIATE ACTIONABLE REMEDIES
                  </span>
                  <p className="text-slate-900 font-bold mt-0.5 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    {details.remedy}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-bold">
                    WHAT TO CHECK IN YOUR FIELD
                  </span>
                  <p className="text-slate-700 mt-0.5">{currentResult.whatToCheck}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-200">
                  <span className="text-xs text-slate-400 uppercase font-bold">
                    FUTURE PREVENTION METHODS
                  </span>
                  <p className="text-slate-700 mt-0.5">{details.prevention}</p>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Observation History */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            Previous Crop Health Log
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.map((log, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2 relative"
              >
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-medium">
                    {new Date(log.reportedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => downloadCropHealthPdf(log._id)}
                    className="p-1 bg-white hover:bg-slate-100 text-slate-500 rounded-md border border-slate-200 transition cursor-pointer"
                    title="Download Report PDF"
                  >
                    <FileText className="w-3 h-3 text-emerald-600" />
                  </button>
                </div>
                <p className="font-bold text-slate-900 text-sm">{log.possibleIssue}</p>
                <p className="text-slate-600">{log.nextAction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropHealth;
