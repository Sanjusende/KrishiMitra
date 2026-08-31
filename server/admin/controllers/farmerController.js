import User from '../../models/User.js';
import Farm from '../../models/Farm.js';
import CropHealth from '../../models/CropHealth.js';
import SupportTicket from '../models/SupportTicket.js';
import VoiceQuery from '../../models/VoiceQuery.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import mongoose from 'mongoose';
import { escapeRegex, pickAllowed, safeInt } from '../../utils/queryHelpers.js';

const ALLOWED_FARMER_STATUS = ['active', 'suspended'];

class FarmerController {
  /**
   * GET /api/admin/farmers
   * Lists all farmers with pagination, search and sorting
   */
  async getFarmers(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;

      const search       = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const statusFilter = pickAllowed(req.query.status, ALLOWED_FARMER_STATUS);

      // Build safe query — never use raw req.query directly
      const query = { role: { $in: ['FARMER', 'farmer'] } };
      if (search) {
        const safe = escapeRegex(search);
        query.$or = [
          { name:  { $regex: safe, $options: 'i' } },
          { email: { $regex: safe, $options: 'i' } },
          { phone: { $regex: safe, $options: 'i' } },
        ];
      }

      // Filter by suspension status (whitelisted)
      if (statusFilter === 'suspended') {
        query.isSuspended = true;
      } else if (statusFilter === 'active') {
        query.isSuspended = { $ne: true };
      }

      // Temporary debug logs for data lineage audit
      console.log("Collection:", User.collection.name);
      console.log("Query:", query);
      console.log("Count:", await User.countDocuments({}));

      // Use lean to return raw objects so we can read dynamically injected isSuspended field
      const farmers = await User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .setOptions({ strict: false })
        .lean();

      const totalFarmers = await User.countDocuments(query).setOptions({ strict: false });

      // Fetch farm count for each farmer
      const farmerIds = farmers.map((f) => f._id);
      const farmCounts = await Farm.aggregate([
        { $match: { userId: { $in: farmerIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]);

      const farmCountMap = farmCounts.reduce((acc, curr) => {
        acc[curr._id.toString()] = curr.count;
        return acc;
      }, {});

      const result = farmers.map((farmer) => ({
        ...farmer,
        isSuspended: farmer.isSuspended || false,
        farmCount: farmCountMap[farmer._id.toString()] || 0,
      }));

      return ApiResponse.success(
        res,
        {
          farmers: result,
          pagination: {
            page,
            limit,
            total: totalFarmers,
            pages: Math.ceil(totalFarmers / limit),
          },
        },
        'Farmers list retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/farmers/:id
   * Get single farmer details along with their farms, scans, tickets and voice companion history
   */
  async getFarmerDetails(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid farmer ID format', 400);
      }

      const farmer = await User.findById(id).select('-password -refreshToken').lean();
      if (!farmer || farmer.role?.toUpperCase() !== 'FARMER') {
        return ApiResponse.error(res, 'Farmer not found', 404);
      }

      const farms = await Farm.find({ userId: id }).lean();
      const farmIds = farms.map((f) => f._id);

      const scans = await CropHealth.find({ farmId: { $in: farmIds } }).sort({ reportedAt: -1 }).limit(10).lean();
      const tickets = await SupportTicket.find({ farmerId: id }).sort({ createdAt: -1 }).lean();
      
      // Fetch voice companion queries
      const voiceQueries = await VoiceQuery.find({ userId: id }).sort({ createdAt: -1 }).limit(10).lean();

      const data = {
        profile: {
          ...farmer,
          isSuspended: farmer.isSuspended || false,
        },
        farms,
        scans,
        tickets,
        voiceQueries,
      };

      return ApiResponse.success(res, data, 'Farmer details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/farmers/:id/suspend
   * Suspends a farmer
   */
  async suspendFarmer(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid farmer ID format', 400);
      }

      const farmer = await User.findById(id);
      if (!farmer || farmer.role?.toUpperCase() !== 'FARMER') {
        return ApiResponse.error(res, 'Farmer not found', 404);
      }

      // Update directly via raw MongoDB client collection to bypass Mongoose strict schema limitations
      await User.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isSuspended: true } }
      );

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'SUSPEND_FARMER',
        module: 'FARMER',
        ipAddress: req.ip,
        details: { farmerId: id, farmerName: farmer.name },
      });

      return ApiResponse.success(res, null, `Farmer ${farmer.name} has been suspended`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/farmers/:id/activate
   * Activates a suspended farmer
   */
  async activateFarmer(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid farmer ID format', 400);
      }

      const farmer = await User.findById(id);
      if (!farmer || farmer.role?.toUpperCase() !== 'FARMER') {
        return ApiResponse.error(res, 'Farmer not found', 404);
      }

      // Update directly via raw MongoDB client collection to bypass Mongoose strict schema limitations
      await User.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isSuspended: false } }
      );

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'ACTIVATE_FARMER',
        module: 'FARMER',
        ipAddress: req.ip,
        details: { farmerId: id, farmerName: farmer.name },
      });

      return ApiResponse.success(res, null, `Farmer ${farmer.name} has been activated`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/farmers/:id
   * Soft deletes or hard deletes a farmer
   */
  async deleteFarmer(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid farmer ID format', 400);
      }

      const farmer = await User.findById(id);
      if (!farmer || farmer.role?.toUpperCase() !== 'FARMER') {
        return ApiResponse.error(res, 'Farmer not found', 404);
      }

      // Delete farmer's farms first
      await Farm.deleteMany({ userId: id });

      // Delete farmer account
      await User.findByIdAndDelete(id);

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'DELETE_FARMER',
        module: 'FARMER',
        ipAddress: req.ip,
        details: { farmerId: id, farmerName: farmer.name },
      });

      return ApiResponse.success(res, null, `Farmer ${farmer.name} and associated farms deleted successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export default new FarmerController();
