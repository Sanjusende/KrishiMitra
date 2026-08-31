import Farm from '../models/Farm.js';
import MarketPrice from '../models/MarketPrice.js';
import ApiResponse from '../utils/apiResponse.js';
import { fetchCropMarketData } from '../services/market/marketDataService.js';

const getFarmContext = async (userId) => {
  try {
    return await Farm.findOne({ userId });
  } catch (err) {
    return null;
  }
};

export const getCurrentMarketData = async (req, res, next) => {
  try {
    const cropName = req.query.crop || 'Wheat';
    const stateName = req.query.state || '';
    const districtName = req.query.district || '';

    let finalState = stateName;
    let finalDistrict = districtName;

    if (!finalState || !finalDistrict) {
      const farm = await getFarmContext(req.user._id);
      if (farm?.location) {
        if (!finalState) finalState = farm.location.state;
        if (!finalDistrict) finalDistrict = farm.location.district;
      }
    }

    if (!finalState) finalState = 'Madhya Pradesh';
    if (!finalDistrict) finalDistrict = 'Indore';

    const data = await fetchCropMarketData(cropName, 'Indore Mandi', finalState, finalDistrict);
    return ApiResponse.success(res, data, 'Current market price data loaded successfully');
  } catch (error) {
    next(error);
  }
};

const escapeRegExp = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getMarketHistory = async (req, res, next) => {
  try {
    const cropName = String(req.query.crop || 'Wheat');
    const stateName = String(req.query.state || '');
    const districtName = String(req.query.district || '');
    const period = String(req.query.period || '7d');
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // Pagination parameters
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    let finalState = stateName;
    let finalDistrict = districtName;

    if (!finalState || !finalDistrict) {
      const farm = await getFarmContext(req.user._id);
      if (farm?.location) {
        if (!finalState) finalState = farm.location.state;
        if (!finalDistrict) finalDistrict = farm.location.district;
      }
    }

    if (!finalState) finalState = 'Madhya Pradesh';
    if (!finalDistrict) finalDistrict = 'Indore';

    // Verify database cache is seeded/synced
    const data = await fetchCropMarketData(cropName, 'Indore Mandi', finalState, finalDistrict);

    // Build DB Query Filter
    const filter = {
      crop: new RegExp(`^${escapeRegExp(cropName)}$`, 'i'),
      state: new RegExp(`^${escapeRegExp(finalState)}$`, 'i'),
      district: new RegExp(`^${escapeRegExp(finalDistrict)}$`, 'i'),
    };

    // Apply Date Range Filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    } else {
      // Otherwise limit by period (7d, 30d, 90d)
      const cutoffDate = new Date();
      if (period === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
      else if (period === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30);
      else cutoffDate.setDate(cutoffDate.getDate() - 90);
      filter.date = { $gte: cutoffDate };
    }

    const totalCount = await MarketPrice.countDocuments(filter);
    const historySeries = await MarketPrice.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return ApiResponse.success(
      res,
      {
        crop: cropName,
        state: finalState,
        district: finalDistrict,
        period,
        page,
        limit,
        totalCount,
        series: historySeries,
      },
      'Market price history loaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getMarketTrend = async (req, res, next) => {
  try {
    const cropName = req.query.crop || 'Wheat';
    const stateName = req.query.state || '';
    const districtName = req.query.district || '';

    let finalState = stateName;
    let finalDistrict = districtName;

    if (!finalState || !finalDistrict) {
      const farm = await getFarmContext(req.user._id);
      if (farm?.location) {
        if (!finalState) finalState = farm.location.state;
        if (!finalDistrict) finalDistrict = farm.location.district;
      }
    }

    if (!finalState) finalState = 'Madhya Pradesh';
    if (!finalDistrict) finalDistrict = 'Indore';

    const data = await fetchCropMarketData(cropName, 'Indore Mandi', finalState, finalDistrict);

    return ApiResponse.success(
      res,
      {
        crop: data.crop,
        state: finalState,
        district: finalDistrict,
        currentPrice: data.currentPrice,
        trend: data.trend,
        changePercent: data.changePercent,
        displayText: data.displayText,
        sellingInsightText: data.sellingInsightText,
      },
      'Market trend insights loaded successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getNearbyMarkets = async (req, res, next) => {
  try {
    const cropName = req.query.crop || 'Wheat';
    const stateName = req.query.state || '';
    const districtName = req.query.district || '';

    let finalState = stateName;
    let finalDistrict = districtName;

    if (!finalState || !finalDistrict) {
      const farm = await getFarmContext(req.user._id);
      if (farm?.location) {
        if (!finalState) finalState = farm.location.state;
        if (!finalDistrict) finalDistrict = farm.location.district;
      }
    }

    if (!finalState) finalState = 'Madhya Pradesh';
    if (!finalDistrict) finalDistrict = 'Indore';

    const data = await fetchCropMarketData(cropName, 'Indore Mandi', finalState, finalDistrict);

    return ApiResponse.success(
      res,
      data.nearbyMarkets || [],
      'Nearby market prices loaded successfully'
    );
  } catch (error) {
    next(error);
  }
};
