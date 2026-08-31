import MarketPrice from '../../models/MarketPrice.js';
import { calculatePriceTrend } from '../../utils/calculateTrend.js';
import axios from 'axios';

// ------------------------------------------------------
// Base Benchmark Prices (Default Fallbacks)
// ------------------------------------------------------
const BASE_CROP_PRICES = Object.freeze({
  Wheat: 2450,
  Rice: 2200,
  Maize: 1950,
  Soybean: 4600,
  Cotton: 6800,
  Potato: 1400,
  Mustard: 5350,
  Sugarcane: 315,
  'Gram/Chickpea': 5100,
  Tomato: 1800,
  Onion: 2100,
  Chilli: 6500,
});

const COMMODITY_MAP = Object.freeze({
  Wheat: 'Wheat',
  Rice: 'Paddy(Dhan)(Common)',
  Maize: 'Maize',
  Soybean: 'Soyabean',
  Cotton: 'Cotton',
  Potato: 'Potato',
  Mustard: 'Mustard',
  Sugarcane: 'Sugarcane',
  'Gram/Chickpea': 'Gram(Raw)',
  Tomato: 'Tomato',
  Onion: 'Onion',
  Chilli: 'Chilli',
});

const DEFAULT_CROP = 'Wheat';
const DEFAULT_MARKET = 'Indore Mandi';
const DEFAULT_STATE = 'Madhya Pradesh';
const DEFAULT_DISTRICT = 'Indore';

const HISTORY_DAYS = 90;
const SHORT_TERM_DAYS = 7;
const MEDIUM_TERM_DAYS = 30;

// ------------------------------------------------------
// Normalization Helpers
// ------------------------------------------------------
const normalizeCropName = (cropName) => {
  if (typeof cropName !== 'string') return DEFAULT_CROP;
  const trimmed = cropName.trim();
  if (!trimmed) return DEFAULT_CROP;
  return BASE_CROP_PRICES[trimmed] ? trimmed : DEFAULT_CROP;
};

const normalizeMarketName = (market) => {
  if (typeof market !== 'string' || !market.trim()) return DEFAULT_MARKET;
  return market.trim();
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const getBenchmarkPrice = (crop) => {
  return BASE_CROP_PRICES[crop] || BASE_CROP_PRICES[DEFAULT_CROP];
};

// Parse Agmarknet arrival_date (DD/MM/YYYY) to standard Date object
const parseArrivalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(dateStr);
};

// ------------------------------------------------------
// Fetch Real-time Agmarknet API Mandi Prices
// ------------------------------------------------------
export const syncAgmarknetPrices = async (cropName, stateName, districtName) => {
  try {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    const resourceId = process.env.MANDI_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';
    if (!apiKey) {
      console.warn('[MarketService] API Key is missing. Skipping data.gov.in fetch.');
      return false;
    }

    const commodity = COMMODITY_MAP[cropName] || cropName;
    const state = stateName || DEFAULT_STATE;
    const district = districtName || DEFAULT_DISTRICT;

    let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=100`;
    url += `&filters[commodity]=${encodeURIComponent(commodity)}`;
    url += `&filters[state]=${encodeURIComponent(state)}`;
    url += `&filters[district]=${encodeURIComponent(district)}`;

    console.log(`[MarketService] Syncing real prices from API: ${url}`);
    const response = await axios.get(url, { timeout: 8000 });

    if (response.data && Array.isArray(response.data.records) && response.data.records.length > 0) {
      const records = response.data.records;
      console.log(`[MarketService] Fetched ${records.length} real market records.`);

      for (const record of records) {
        const modalPrice = Number(record.modal_price);
        if (isNaN(modalPrice) || modalPrice <= 0) continue;

        const date = parseArrivalDate(record.arrival_date);

        // Upsert record into MongoDB to prevent duplicate entries
        await MarketPrice.findOneAndUpdate(
          {
            crop: cropName,
            market: record.market || DEFAULT_MARKET,
            state: record.state || state,
            district: record.district || district,
            date: {
              $gte: new Date(date.setHours(0, 0, 0, 0)),
              $lte: new Date(date.setHours(23, 59, 59, 999)),
            },
          },
          {
            crop: cropName,
            market: record.market || DEFAULT_MARKET,
            state: record.state || state,
            district: record.district || district,
            price: modalPrice,
            unit: 'Quintal',
            date: date,
            trend: 'Stable',
            changePercent: 0,
            source: 'agmarknet',
          },
          { upsert: true, new: true }
        );
      }
      return true;
    }
  } catch (error) {
    console.error('[MarketService] Failed to sync Agmarknet prices:', error.message);
  }
  return false;
};

// ------------------------------------------------------
// Generate Fallback Historical Data (NO Math.sin or random)
// ------------------------------------------------------
const generateFallbackHistory = ({ crop, market, state, district, basePrice }) => {
  const history90d = [];
  const today = new Date();

  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    // Deterministic cyclical pattern using daysAgo modulus
    const seasonalVariation = ((daysAgo % 20) - 10) * (basePrice * 0.002);
    const gradualTrend = (HISTORY_DAYS - 1 - daysAgo) * (basePrice * 0.0005);
    const price = Math.max(1, Math.round(basePrice + seasonalVariation + gradualTrend));

    history90d.push({
      crop,
      market,
      state: state || DEFAULT_STATE,
      district: district || DEFAULT_DISTRICT,
      price,
      unit: 'Quintal',
      date,
      trend: 'Stable',
      changePercent: 0,
      source: 'benchmark',
    });
  }

  return history90d;
};

// ------------------------------------------------------
// Main Market Data Service
// ------------------------------------------------------
export const fetchCropMarketData = async (
  cropName = DEFAULT_CROP,
  marketLocation = DEFAULT_MARKET,
  stateName = DEFAULT_STATE,
  districtName = DEFAULT_DISTRICT
) => {
  const crop = normalizeCropName(cropName);
  const market = normalizeMarketName(marketLocation);
  const state = stateName || DEFAULT_STATE;
  const district = districtName || DEFAULT_DISTRICT;

  // 1. Attempt to sync live data from Agmarknet API (if not already fetched today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await MarketPrice.countDocuments({
    crop,
    state,
    district,
    date: { $gte: todayStart },
  });

  if (todayCount === 0) {
    await syncAgmarknetPrices(crop, state, district);
  }

  const escapeRegExp = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2. Fetch stored history from database
  let databaseRecords = await MarketPrice.find({
    crop,
    market: new RegExp(`^${escapeRegExp(market)}$`, 'i'),
    state: new RegExp(`^${escapeRegExp(state)}$`, 'i'),
    district: new RegExp(`^${escapeRegExp(district)}$`, 'i'),
  })
    .sort({ date: 1 })
    .limit(HISTORY_DAYS)
    .lean();

  // If no records found for the specific market, fallback to state/district level records
  if (databaseRecords.length === 0) {
    databaseRecords = await MarketPrice.find({
      crop,
      state: new RegExp(`^${escapeRegExp(state)}$`, 'i'),
      district: new RegExp(`^${escapeRegExp(district)}$`, 'i'),
    })
      .sort({ date: 1 })
      .limit(HISTORY_DAYS)
      .lean();
  }

  let history90d = databaseRecords;
  let isLiveData = databaseRecords.length > 0;
  let dataSource = isLiveData ? 'agmarknet' : 'benchmark';

  // 3. Fallback to generating and seeding deterministic data if DB is empty
  if (history90d.length === 0) {
    const primaryFallback = generateFallbackHistory({
      crop,
      market,
      state,
      district,
      basePrice: getBenchmarkPrice(crop),
    });

    const dewasFallback = generateFallbackHistory({
      crop,
      market: 'Dewas Mandi',
      state,
      district: 'Dewas',
      basePrice: Math.round(getBenchmarkPrice(crop) * 1.015),
    });

    const ujjainFallback = generateFallbackHistory({
      crop,
      market: 'Ujjain Mandi',
      state,
      district: 'Ujjain',
      basePrice: Math.round(getBenchmarkPrice(crop) * 0.99),
    });

    const bhopalFallback = generateFallbackHistory({
      crop,
      market: 'Bhopal Mandi',
      state,
      district: 'Bhopal',
      basePrice: Math.round(getBenchmarkPrice(crop) * 1.05),
    });

    const fallbackList = [
      ...primaryFallback,
      ...dewasFallback,
      ...ujjainFallback,
      ...bhopalFallback,
    ];

    // Seed fallback data to MongoDB so dynamic queries are always served from DB
    await MarketPrice.insertMany(fallbackList);
    history90d = primaryFallback;
  }

  // 4. Time range histories
  const history7d = history90d.slice(-SHORT_TERM_DAYS);
  const history30d = history90d.slice(-MEDIUM_TERM_DAYS);

  // 5. Current price calculations
  const latestRecord = history90d[history90d.length - 1];
  const currentPrice = Number(latestRecord?.price) || getBenchmarkPrice(crop);

  const previousRecord =
    history90d.length >= SHORT_TERM_DAYS
      ? history90d[history90d.length - SHORT_TERM_DAYS]
      : history90d[0];
  const price7DaysAgo = Number(previousRecord?.price) || currentPrice;

  // Calculate Trend
  const trendResult = calculatePriceTrend(currentPrice, price7DaysAgo);

  // 6. Query database for nearby markets comparison
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // last 7 days of records

  const stateRecords = await MarketPrice.find({
    crop,
    state: new RegExp(`^${escapeRegExp(state)}$`, 'i'),
    date: { $gte: cutoffDate },
  }).sort({ date: -1 }).lean();

  const marketMap = new Map();
  for (const record of stateRecords) {
    if (!marketMap.has(record.market)) {
      marketMap.set(record.market, record);
    }
  }

  const nearbyMarkets = [];
  const distances = {
    'Dewas': 34,
    'Ujjain': 55,
    'Bhopal': 180,
    'Indore': 0,
    'Dhar': 64,
    'Khandwa': 130,
    'Khargone': 145,
  };

  marketMap.forEach((record, mName) => {
    let dist = 50;
    for (const key in distances) {
      if (mName.toLowerCase().includes(key.toLowerCase())) {
        dist = distances[key];
        break;
      }
    }
    nearbyMarkets.push({
      market: mName,
      price: record.price,
      distanceKm: dist,
      changePercent: record.changePercent || 0,
    });
  });

  // Ensure primary market is first in the list
  const primaryIndex = nearbyMarkets.findIndex(m => m.market.toLowerCase() === market.toLowerCase());
  if (primaryIndex > -1) {
    const [primaryItem] = nearbyMarkets.splice(primaryIndex, 1);
    nearbyMarkets.unshift(primaryItem);
  } else {
    nearbyMarkets.unshift({
      market,
      price: currentPrice,
      distanceKm: 0,
      changePercent: trendResult.changePercent
    });
  }

  return {
    crop,
    market,
    state,
    district,
    currentPrice,
    unit: '₹/Quintal',
    date: formatDate(new Date(latestRecord.date)),
    trend: trendResult.trend,
    changePercent: trendResult.changePercent,
    displayText: trendResult.displayText,
    sellingInsightText: trendResult.sellingInsightText,
    history7d: history7d.map((r) => ({ ...r, date: formatDate(new Date(r.date)) })),
    history30d: history30d.map((r) => ({ ...r, date: formatDate(new Date(r.date)) })),
    history90d: history90d.map((r) => ({ ...r, date: formatDate(new Date(r.date)) })),
    nearbyMarkets,
    source: dataSource,
    isLiveData,
    dataStatus: isLiveData ? 'DATABASE' : 'BENCHMARK_FALLBACK',
  };
};