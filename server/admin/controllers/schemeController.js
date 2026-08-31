import GovernmentScheme from '../models/GovernmentScheme.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import mongoose from 'mongoose';
import { escapeRegex, safeInt } from '../../utils/queryHelpers.js';

class SchemeController {
  /**
   * GET /api/admin/schemes
   * Lists all government schemes
   */
  async getSchemes(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;

      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const query = {};
      if (search) {
        const safe = escapeRegex(search);
        query.$or = [
          { schemeName:  { $regex: safe, $options: 'i' } },
          { description: { $regex: safe, $options: 'i' } },
        ];
      }

      const schemes = await GovernmentScheme.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await GovernmentScheme.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          schemes,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Government schemes list retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/schemes/:id
   * Get single scheme details
   */
  async getSchemeById(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid government scheme ID format', 400);
      }
      const scheme = await GovernmentScheme.findById(id).lean();
      if (!scheme) {
        return ApiResponse.error(res, 'Government scheme not found', 404);
      }
      return ApiResponse.success(res, scheme, 'Scheme retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/schemes
   * Create new scheme
   */
  async createScheme(req, res, next) {
    try {
      const { schemeName, description, eligibility, benefits, applyLink } = req.body;

      if (!schemeName || !description || !eligibility || !benefits) {
        return ApiResponse.error(res, 'Scheme Name, description, eligibility, and benefits are required', 400);
      }

      const scheme = await GovernmentScheme.create({
        schemeName,
        description,
        eligibility,
        benefits,
        applyLink: applyLink || '',
      });

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'CREATE_SCHEME',
        module: 'SCHEME',
        ipAddress: req.ip,
        details: { schemeId: scheme._id, schemeName: scheme.schemeName },
      });

      return ApiResponse.success(res, scheme, 'Government scheme created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/schemes/:id
   * Update existing scheme
   */
  async updateScheme(req, res, next) {
    try {
      const { id } = req.params;
      const { schemeName, description, eligibility, benefits, applyLink } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid government scheme ID format', 400);
      }

      const scheme = await GovernmentScheme.findById(id);
      if (!scheme) {
        return ApiResponse.error(res, 'Government scheme not found', 404);
      }

      if (schemeName) scheme.schemeName = schemeName;
      if (description) scheme.description = description;
      if (eligibility) scheme.eligibility = eligibility;
      if (benefits) scheme.benefits = benefits;
      if (applyLink !== undefined) scheme.applyLink = applyLink;

      await scheme.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'UPDATE_SCHEME',
        module: 'SCHEME',
        ipAddress: req.ip,
        details: { schemeId: scheme._id, schemeName: scheme.schemeName },
      });

      return ApiResponse.success(res, scheme, 'Government scheme updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/schemes/:id
   * Delete scheme
   */
  async deleteScheme(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid government scheme ID format', 400);
      }

      const scheme = await GovernmentScheme.findById(id);
      if (!scheme) {
        return ApiResponse.error(res, 'Government scheme not found', 404);
      }

      await GovernmentScheme.findByIdAndDelete(id);

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'DELETE_SCHEME',
        module: 'SCHEME',
        ipAddress: req.ip,
        details: { schemeId: id, schemeName: scheme.schemeName },
      });

      return ApiResponse.success(res, null, 'Government scheme deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new SchemeController();
