import CropHealth from '../../models/CropHealth.js';
import ApiResponse from '../../utils/apiResponse.js';
import mongoose from 'mongoose';
import { escapeRegex, pickAllowed, safeInt } from '../../utils/queryHelpers.js';

const ALLOWED_HEALTH_STATUS = ['Healthy', 'Diseased'];

class CropHealthController {
  /**
   * GET /api/admin/crop-health
   * List all AI crop health scans in the system
   */
  async getCropHealthScans(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;

      const healthFilter = pickAllowed(req.query.health, ALLOWED_HEALTH_STATUS);
      const cropFilter   = typeof req.query.crop === 'string' ? req.query.crop.trim() : '';

      const query = {};
      if (healthFilter) query.health = healthFilter;   // safe: whitelist-validated
      if (cropFilter)   query.crop   = { $regex: escapeRegex(cropFilter), $options: 'i' };

      const scans = await CropHealth.find(query)
        .populate({
          path: 'farmId',
          select: 'name location currentCrop',
          populate: {
            path: 'userId',
            select: 'name email phone',
          },
        })
        .sort({ reportedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalScans = await CropHealth.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          scans,
          pagination: {
            page,
            limit,
            total: totalScans,
            pages: Math.ceil(totalScans / limit),
          },
        },
        'Crop health scans retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/crop-health/:id
   * Get detail of a specific crop health scan
   */
  async getCropHealthScanById(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid crop health scan ID format', 400);
      }

      const scan = await CropHealth.findById(id)
        .populate({
          path: 'farmId',
          select: 'name location landSize soilType currentCrop growthStage season',
          populate: {
            path: 'userId',
            select: 'name email phone language',
          },
        })
        .lean();

      if (!scan) {
        return ApiResponse.error(res, 'Crop health scan record not found', 404);
      }

      return ApiResponse.success(res, scan, 'Crop health scan record retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new CropHealthController();
