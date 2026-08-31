import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { Sprout, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { getCropRecommendations } from '../services/cropRecommendationService';

const RECOMMENDATION_RULES = [
  {
    soil: 'Black Soil',
    season: 'Kharif',
    crops: [
      {
        name: 'Soybean',
        score: '95% Match',
        reasoning:
          'Black soil has high clay content and moisture retention, perfect for soybean root nodulation during Kharif rains.',
      },
      {
        name: 'Maize',
        score: '88% Match',
        reasoning:
          'Deep black soil provides excellent nutrient uptake for hybrid maize cob development.',
      },
      {
        name: 'Cotton',
        score: '85% Match',
        reasoning:
          'Black cotton soil of Malwa/Deccan region provides suitable aeration for deep tap roots.',
      },
    ],
  },
  {
    soil: 'Black Soil',
    season: 'Rabi',
    crops: [
      {
        name: 'Wheat',
        score: '98% Match',
        reasoning:
          'Cool Rabi winter temperature combined with black soil moisture storage yields high protein wheat grain.',
      },
      {
        name: 'Gram / Chickpea',
        score: '90% Match',
        reasoning: 'Low irrigation requirement; thrives on residual moisture in black soil.',
      },
    ],
  },
  {
    soil: 'Default',
    season: 'Kharif',
    crops: [
      {
        name: 'Rice',
        score: '90% Match',
        reasoning: 'Suitable for monsoon water availability and clay loam soil.',
      },
      {
        name: 'Maize',
        score: '85% Match',
        reasoning: 'High yield potential with moderate fertilizer response.',
      },
    ],
  },
];

// Detailed telemetry suitability specifications for recommended crops
const CROP_SUITABILITY_DETAILS = {
  Soybean: {
    npk: 'N: 20, P: 60, K: 40 (Low Nitrogen demand due to root nodulation)',
    yield: '8 - 10 Quintals / Acre',
    profit: '₹22,000 - ₹28,000 / Acre',
    water: 'Medium (Rainfall-dependent)',
    risk: 'Low (Ideal clay moisture response)',
    demand: 'High (Indore oil mills hub demand)',
  },
  Maize: {
    npk: 'N: 120, P: 60, K: 40 (High Nitrogen response)',
    yield: '20 - 24 Quintals / Acre',
    profit: '₹18,000 - ₹24,000 / Acre',
    water: 'Medium',
    risk: 'Medium (Prone to excess water lodging)',
    demand: 'Moderate (Feed industry benchmark)',
  },
  Cotton: {
    npk: 'N: 80, P: 40, K: 40',
    yield: '10 - 12 Quintals / Acre',
    profit: '₹35,000 - ₹45,000 / Acre',
    water: 'Medium-High',
    risk: 'High (Bollworm pest vulnerability)',
    demand: 'Very High (Textile hub preference)',
  },
  Wheat: {
    npk: 'N: 120, P: 60, K: 40 (Balanced nutrition required)',
    yield: '18 - 22 Quintals / Acre',
    profit: '₹28,500 - ₹35,000 / Acre',
    water: 'Medium (Rabi residual moisture + 4 irrigations)',
    risk: 'Low (Ideal cool Rabi winter alignment)',
    demand: 'High (Indore Sharbati grade premium rates)',
  },
  'Gram / Chickpea': {
    npk: 'N: 20, P: 50, K: 20 (Self nitrogen-fixing pulse)',
    yield: '6 - 8 Quintals / Acre',
    profit: '₹24,000 - ₹30,005 / Acre',
    water: 'Low (Requires minimal winter irrigation)',
    risk: 'Low (Drought-tolerant root system)',
    demand: 'High (Pulses processing industry demand)',
  },
  Rice: {
    npk: 'N: 120, P: 60, K: 60',
    yield: '22 - 26 Quintals / Acre',
    profit: '₹25,000 - ₹32,000 / Acre',
    water: 'High (Flooded conditions required)',
    risk: 'Medium (Requires assured water supply)',
    demand: 'High (Local food supply chains)',
  },
};

const CropRecommendation = () => {
  const { farm } = useFarm();

  const [soilType, setSoilType] = useState(farm?.soilType || 'Black Soil');
  const [season, setSeason] = useState(farm?.season || 'Kharif');
  const [N, setN] = useState(80);
  const [P, setP] = useState(40);
  const [K, setK] = useState(40);
  const [pH, setPh] = useState(6.5);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await getCropRecommendations({ N, P, K, pH, season, soilType });
      if (res && res.success) {
        setRecommendations(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching crop recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [N, P, K, pH, season, soilType]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Sprout className="w-8 h-8 text-emerald-600 animate-pulse" />
          Crop Recommendation Engine
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Discover optimal crop choices based on your region (
          {farm?.location?.display || 'Indore, MP'}), soil type, and upcoming season.
        </p>
      </div>

      {/* Input Selector Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Soil Type</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
            >
              <option value="Black Soil">Black Soil</option>
              <option value="Red Soil">Red Soil</option>
              <option value="Alluvial Soil">Alluvial Soil</option>
              <option value="Clay Soil">Clay Soil</option>
              <option value="Sandy Soil">Sandy Soil</option>
              <option value="Loamy Soil">Loamy Soil</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
              Upcoming Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
            >
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Zaid">Zaid (Summer)</option>
            </select>
          </div>
        </div>

        {/* Soil NPK & pH Telemetry Sliders */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nitrogen (N: {N} kg/ha)</label>
            <input
              type="range" min="10" max="200" value={N}
              onChange={(e) => setN(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Phosphorus (P: {P} kg/ha)</label>
            <input
              type="range" min="10" max="150" value={P}
              onChange={(e) => setP(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Potassium (K: {K} kg/ha)</label>
            <input
              type="range" min="10" max="150" value={K}
              onChange={(e) => setK(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">pH Level: {pH.toFixed(1)}</label>
            <input
              type="range" min="4" max="9" step="0.1" value={pH}
              onChange={(e) => setPh(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Output Crop List with Reasoning */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          Recommended Crops for {soilType} ({season} Season)
        </h2>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-md flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Generating Crop Recommendations...</p>
          </div>
        ) : recommendations.length > 0 ? (
          recommendations.map((crop, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4 hover:border-emerald-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  {crop.crop}
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  {crop.score}% Match
                </span>
              </div>

              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                💡 <strong>Agronomic Reasoning:</strong> {crop.reasoning}
              </p>

              {crop.diagnostics && crop.diagnostics.length > 0 && (
                <div className="text-xs text-amber-800 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100/50">
                  ⚠️ <strong>Soil Telemetry Diagnostics:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    {crop.diagnostics.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI TELEMETRY METRICS GRID */}
              {CROP_SUITABILITY_DETAILS[crop.crop] && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-3 border-t border-slate-100 text-left">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Ideal Crop NPK
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {CROP_SUITABILITY_DETAILS[crop.crop].npk}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Estimated Yield / Acre
                    </span>
                    <span className="text-xs font-black text-emerald-800">
                      {CROP_SUITABILITY_DETAILS[crop.crop].yield}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Net Profit Est. / Acre
                    </span>
                    <span className="text-xs font-black text-emerald-800">
                      {CROP_SUITABILITY_DETAILS[crop.crop].profit}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Water Demand Index
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {CROP_SUITABILITY_DETAILS[crop.crop].water}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Operational Risk
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {CROP_SUITABILITY_DETAILS[crop.crop].risk}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Mandi Market Demand
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {CROP_SUITABILITY_DETAILS[crop.crop].demand}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md text-center text-xs text-slate-500 font-semibold">
            No suitability recommendations found for these conditions.
          </div>
        )}
      </div>
    </div>
  );
};

export default CropRecommendation;