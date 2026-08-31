import Farm from '../../models/Farm.js';
import User from '../../models/User.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import mongoose from 'mongoose';
import { escapeRegex, pickAllowed, safeInt } from '../../utils/queryHelpers.js';

const ALLOWED_SOIL_TYPES = [
  'Black Cotton Soil', 'Red Soil', 'Alluvial Soil',
  'Clay Soil', 'Sandy Soil', 'Loamy Soil', 'Unknown/Not sure',
];

class FarmController {
  /**
   * GET /api/admin/farms
   * Retrieves list of all farms with pagination and search
   */
  async getFarms(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;

      const search   = typeof req.query.search   === 'string' ? req.query.search.trim()   : '';
      const soilType = pickAllowed(req.query.soilType, ALLOWED_SOIL_TYPES);
      const crop     = typeof req.query.crop     === 'string' ? req.query.crop.trim()     : '';

      const query = {};
      if (search)   query.name        = { $regex: escapeRegex(search), $options: 'i' };
      if (soilType) query.soilType     = soilType;  // safe: whitelist-validated
      if (crop)     query.currentCrop  = { $regex: escapeRegex(crop),   $options: 'i' };

      const farms = await Farm.find(query)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalFarms = await Farm.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          farms,
          pagination: {
            page,
            limit,
            total: totalFarms,
            pages: Math.ceil(totalFarms / limit),
          },
        },
        'Farms list retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/farms/:id
   * Get single farm details
   */
  async getFarmById(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid farm ID format', 400);
      }
      const farm = await Farm.findById(String(id)).populate('userId', 'name email phone').lean();
      if (!farm) {
        return ApiResponse.error(res, 'Farm profile not found', 404);
      }
      return ApiResponse.success(res, farm, 'Farm retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/farms
   * Creates a new farm profile for a farmer
   */
  async createFarm(req, res, next) {
    try {
      const {
        userId,
        name,
        locationDisplay,
        lat,
        lng,
        state,
        district,
        village,
        landSizeValue,
        landSizeUnit,
        soilType,
        currentCrop,
        growthStage,
        season,
      } = req.body;

      if (!userId || !locationDisplay || !lat || !lng || !landSizeValue || !currentCrop) {
        return ApiResponse.error(res, 'Required fields: userId, locationDisplay, lat, lng, landSizeValue, currentCrop', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return ApiResponse.error(res, 'Invalid user ID format', 400);
      }

      // Check if user exists
      const user = await User.findById(String(userId));
      if (!user) {
        return ApiResponse.error(res, 'User/Farmer not found', 404);
      }

      const farm = await Farm.create({
        userId,
        name: name || 'My Farm',
        location: {
          display: locationDisplay,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          state: state || '',
          district: district || '',
          village: village || '',
        },
        landSize: {
          value: parseFloat(landSizeValue),
          unit: landSizeUnit || 'acres',
        },
        soilType: soilType || 'Unknown/Not sure',
        currentCrop,
        growthStage: growthStage || 'Vegetative',
        season: season || 'Kharif',
      });

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'CREATE_FARM',
        module: 'FARM',
        ipAddress: req.ip,
        details: { farmId: farm._id, farmName: farm.name, farmerId: userId },
      });

      return ApiResponse.success(res, farm, 'Farm profile created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/farms/:id
   * Updates an existing farm profile
   */
  async updateFarm(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        locationDisplay,
        lat,
        lng,
        state,
        district,
        village,
        landSizeValue,
        landSizeUnit,
        soilType,
        currentCrop,
        growthStage,
        season,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid farm ID format', 400);
      }

      const farm = await Farm.findById(String(id));
      if (!farm) {
        return ApiResponse.error(res, 'Farm profile not found', 404);
      }

      if (name) farm.name = name;
      if (locationDisplay || lat || lng) {
        farm.location = {
          display: locationDisplay || farm.location.display,
          lat: lat !== undefined ? parseFloat(lat) : farm.location.lat,
          lng: lng !== undefined ? parseFloat(lng) : farm.location.lng,
          state: state !== undefined ? state : farm.location.state,
          district: district !== undefined ? district : farm.location.district,
          village: village !== undefined ? village : farm.location.village,
        };
      }
      if (landSizeValue || landSizeUnit) {
        farm.landSize = {
          value: landSizeValue !== undefined ? parseFloat(landSizeValue) : farm.landSize.value,
          unit: landSizeUnit || farm.landSize.unit,
        };
      }
      if (soilType) farm.soilType = soilType;
      if (currentCrop) farm.currentCrop = currentCrop;
      if (growthStage) farm.growthStage = growthStage;
      if (season) farm.season = season;

      await farm.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'UPDATE_FARM',
        module: 'FARM',
        ipAddress: req.ip,
        details: { farmId: farm._id, farmName: farm.name },
      });

      return ApiResponse.success(res, farm, 'Farm profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/farms/:id
   * Deletes a farm profile
   */
  async deleteFarm(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid farm ID format', 400);
      }

      const farm = await Farm.findById(String(id));
      if (!farm) {
        return ApiResponse.error(res, 'Farm profile not found', 404);
      }

      await Farm.findByIdAndDelete(String(id));

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'DELETE_FARM',
        module: 'FARM',
        ipAddress: req.ip,
        details: { farmId: id, farmName: farm.name, farmerId: farm.userId },
      });

      return ApiResponse.success(res, null, 'Farm profile deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new FarmController();
