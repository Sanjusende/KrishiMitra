import Disease from '../models/Disease.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';
import mongoose from 'mongoose';
import { escapeRegex, safeInt } from '../../utils/queryHelpers.js';

class DiseaseController {
  /**
   * GET /api/admin/diseases
   * List all diseases with optional query filters
   */
  async getDiseases(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;

      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const crop   = typeof req.query.crop   === 'string' ? req.query.crop.trim()   : '';

      const query = {};
      if (search) query.diseaseName = { $regex: escapeRegex(search), $options: 'i' };
      if (crop)   query.crop        = { $regex: escapeRegex(crop),   $options: 'i' };

      const diseases = await Disease.find(query)
        .sort({ diseaseName: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Disease.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          diseases,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Disease knowledge base retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/diseases/:id
   * Get single disease entry
   */
  async getDiseaseById(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid disease ID format', 400);
      }
      const disease = await Disease.findById(id).lean();
      if (!disease) {
        return ApiResponse.error(res, 'Disease not found in knowledge base', 404);
      }
      return ApiResponse.success(res, disease, 'Disease retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/diseases
   * Create new disease entry in knowledge base
   */
  async createDisease(req, res, next) {
    try {
      const { diseaseName, crop, symptoms, causes, prevention, treatment, recommendedPesticide, severity } = req.body;

      if (!diseaseName || !crop || !symptoms) {
        return ApiResponse.error(res, 'Disease Name, crop, and symptoms are required fields', 400);
      }

      const disease = await Disease.create({
        diseaseName,
        crop,
        symptoms,
        causes: Array.isArray(causes) ? causes : (causes ? [causes] : []),
        prevention: Array.isArray(prevention) ? prevention : (prevention ? [prevention] : []),
        treatment: Array.isArray(treatment) ? treatment : (treatment ? [treatment] : []),
        recommendedPesticide: recommendedPesticide || '',
        severity: severity || 'Medium',
      });

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'CREATE_DISEASE',
        module: 'DISEASE',
        ipAddress: req.ip,
        details: { diseaseId: disease._id, diseaseName: disease.diseaseName, crop: disease.crop },
      });

      return ApiResponse.success(res, disease, 'Disease added to knowledge base successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/diseases/:id
   * Update existing disease entry
   */
  async updateDisease(req, res, next) {
    try {
      const { id } = req.params;
      const { diseaseName, crop, symptoms, causes, prevention, treatment, recommendedPesticide, severity } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid disease ID format', 400);
      }

      const disease = await Disease.findById(id);
      if (!disease) {
        return ApiResponse.error(res, 'Disease entry not found', 404);
      }

      if (diseaseName) disease.diseaseName = diseaseName;
      if (crop) disease.crop = crop;
      if (symptoms) disease.symptoms = symptoms;
      if (causes) disease.causes = Array.isArray(causes) ? causes : [causes];
      if (prevention) disease.prevention = Array.isArray(prevention) ? prevention : [prevention];
      if (treatment) disease.treatment = Array.isArray(treatment) ? treatment : [treatment];
      if (recommendedPesticide !== undefined) disease.recommendedPesticide = recommendedPesticide;
      if (severity) disease.severity = severity;

      await disease.save();

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'UPDATE_DISEASE',
        module: 'DISEASE',
        ipAddress: req.ip,
        details: { diseaseId: disease._id, diseaseName: disease.diseaseName },
      });

      return ApiResponse.success(res, disease, 'Disease entry updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/diseases/:id
   * Delete disease entry
   */
  async deleteDisease(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, 'Invalid disease ID format', 400);
      }

      const disease = await Disease.findById(id);
      if (!disease) {
        return ApiResponse.error(res, 'Disease entry not found', 404);
      }

      await Disease.findByIdAndDelete(id);

      // Audit Log
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: 'DELETE_DISEASE',
        module: 'DISEASE',
        ipAddress: req.ip,
        details: { diseaseId: id, diseaseName: disease.diseaseName },
      });

      return ApiResponse.success(res, null, 'Disease entry deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new DiseaseController();
