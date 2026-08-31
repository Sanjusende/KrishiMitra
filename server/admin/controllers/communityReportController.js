import CommunityReport from '../../models/CommunityReport.js';
import ApiResponse from '../../utils/apiResponse.js';
import { escapeRegex, safeInt } from '../../utils/queryHelpers.js';

class CommunityReportController {
  /**
   * GET /api/admin/community-reports
   * Retrieves all community crop reports with pagination
   */
  async getReports(req, res, next) {
    try {
      const page  = safeInt(req.query.page, 1, 1);
      const limit = safeInt(req.query.limit, 10, 1, 100);
      const skip  = (page - 1) * limit;
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const query = {};
      if (search) {
        const safe = escapeRegex(search);
        query.$or = [
          { crop:          { $regex: safe, $options: 'i' } },
          { possibleIssue: { $regex: safe, $options: 'i' } },
        ];
      }

      const reports = await CommunityReport.find(query)
        .sort({ lastReportedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await CommunityReport.countDocuments(query);

      return ApiResponse.success(
        res,
        {
          reports,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Community reports retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new CommunityReportController();
