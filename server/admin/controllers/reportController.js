import User from '../../models/User.js';
import Farm from '../../models/Farm.js';
import CropHealth from '../../models/CropHealth.js';
import Irrigation from '../../models/Irrigation.js';
import Weather from '../../models/Weather.js';
import MarketPrice from '../../models/MarketPrice.js';
import pdfService from '../services/pdfService.js';
import auditService from '../services/auditService.js';
import ApiResponse from '../../utils/apiResponse.js';

/**
 * Format CSV helper
 */
const convertToCSV = (headers, rows) => {
  const headerString = headers.join(',') + '\n';
  const rowStrings = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = cell !== null && cell !== undefined ? String(cell) : '';
          // Escape quotes and wrap in quotes if commas/newlines exist
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
  return headerString + rowStrings;
};

class ReportController {
  /**
   * GET /api/admin/reports/export
   * Generates and downloads system reports
   */
  async exportReport(req, res, next) {
    try {
      const ALLOWED_MODULES = ['farmers', 'crops', 'diseases', 'irrigation', 'weather', 'market'];
      const ALLOWED_FORMATS = ['pdf', 'csv', 'excel'];

      const module = typeof req.query.module === 'string' ? req.query.module.trim().toLowerCase() : '';
      const format = typeof req.query.format === 'string' ? req.query.format.trim().toLowerCase() : '';

      if (!module || !ALLOWED_MODULES.includes(module)) {
        return ApiResponse.error(res, `Invalid or missing "module". Allowed: ${ALLOWED_MODULES.join('|')}`, 400);
      }
      if (!format || !ALLOWED_FORMATS.includes(format)) {
        return ApiResponse.error(res, `Invalid or missing "format". Allowed: ${ALLOWED_FORMATS.join('|')}`, 400);
      }

      let headers = [];
      let rows = [];
      let reportTitle = '';

      // 1. Fetch Module Data
      if (module === 'farmers') {
        reportTitle = 'KrishiMitra Registered Farmers Report';
        headers = ['Name', 'Email', 'Phone', 'Verified', 'Language', 'Joined Date'];
        const data = await User.find({ role: { $in: ['FARMER', 'farmer'] } }).sort({ createdAt: -1 }).lean();
        rows = data.map((u) => [
          u.name,
          u.email,
          u.phone || 'N/A',
          u.isVerified ? 'YES' : 'NO',
          u.language || 'EN',
          u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
        ]);
      } else if (module === 'crops') {
        reportTitle = 'KrishiMitra Crop Farm Profiles Report';
        headers = ['Farm Name', 'Farmer Email', 'Size', 'Soil Type', 'Current Crop', 'Season', 'Growth Stage'];
        const data = await Farm.find({}).populate('userId', 'email').sort({ createdAt: -1 }).lean();
        rows = data.map((f) => [
          f.name,
          f.userId?.email || 'N/A',
          `${f.landSize?.value || 0} ${f.landSize?.unit || 'acres'}`,
          f.soilType || 'N/A',
          f.currentCrop || 'N/A',
          f.season || 'N/A',
          f.growthStage || 'N/A',
        ]);
      } else if (module === 'diseases') {
        reportTitle = 'KrishiMitra AI Crop Disease Scans Report';
        headers = ['Farm Crop', 'Diagnosis', 'Severity', 'Confidence', 'Affected Area', 'Scan Date'];
        const data = await CropHealth.find({}).sort({ reportedAt: -1 }).lean();
        rows = data.map((d) => [
          d.crop || 'N/A',
          d.disease || d.possibleIssue || 'Healthy',
          d.severity || 'N/A',
          d.confidence || 'N/A',
          d.affectedArea || 'N/A',
          d.reportedAt ? new Date(d.reportedAt).toLocaleDateString() : 'N/A',
        ]);
      } else if (module === 'irrigation') {
        reportTitle = 'KrishiMitra Smart Irrigation Analyses Report';
        headers = ['Farm ID', 'Decision', 'Rain Prob %', 'Expected Rain (mm)', 'Water Need (mm)', 'Date'];
        const data = await Irrigation.find({}).sort({ date: -1 }).lean();
        rows = data.map((i) => [
          i.farmId ? String(i.farmId) : 'N/A',
          i.decision,
          i.reasoning?.rainProbability !== undefined ? `${i.reasoning.rainProbability}%` : 'N/A',
          i.reasoning?.expectedRainfallMm !== undefined ? `${i.reasoning.expectedRainfallMm} mm` : '0 mm',
          i.reasoning?.cropWaterNeedMm !== undefined ? `${i.reasoning.cropWaterNeedMm} mm` : '0 mm',
          i.date ? new Date(i.date).toLocaleDateString() : 'N/A',
        ]);
      } else if (module === 'weather') {
        reportTitle = 'KrishiMitra Weather Forecast History Report';
        headers = ['Coords', 'Temp (°C)', 'Humidity %', 'Rain Prob %', 'Rainfall (mm)', 'Condition', 'Date'];
        const data = await Weather.find({}).sort({ fetchedAt: -1 }).limit(100).lean();
        rows = data.map((w) => [
          w.latitude && w.longitude ? `${w.latitude.toFixed(2)},${w.longitude.toFixed(2)}` : 'N/A',
          w.temperature !== undefined ? `${w.temperature}°C` : 'N/A',
          w.humidity !== undefined ? `${w.humidity}%` : 'N/A',
          w.rainProbability !== undefined ? `${w.rainProbability}%` : 'N/A',
          w.rainfallMm !== undefined ? `${w.rainfallMm} mm` : 'N/A',
          w.weatherCondition || 'N/A',
          w.fetchedAt ? new Date(w.fetchedAt).toLocaleDateString() : 'N/A',
        ]);
      } else if (module === 'market') {
        reportTitle = 'KrishiMitra Mandi Commodity Prices Report';
        headers = ['Crop', 'Price', 'Unit', 'Trend', 'Mandi Source', 'Date'];
        const data = await MarketPrice.find({}).sort({ date: -1 }).limit(100).lean();
        rows = data.map((m) => [
          m.crop,
          m.currentPrice || 0,
          m.unit || '₹/Quintal',
          m.trend || 'N/A',
          m.displayText?.split(' ')[3] || 'Benchmark Mandi',
          m.date ? new Date(m.date).toLocaleDateString() : 'N/A',
        ]);
      } else {
        return ApiResponse.error(res, 'Invalid report module. Allowed: farmers|crops|diseases|irrigation|weather|market', 400);
      }

      // 2. Generate and Send Output
      await auditService.logAction({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action: `EXPORT_REPORT_${module.toUpperCase()}`,
        module: 'REPORT',
        ipAddress: req.ip,
        details: { format },
      });

      if (format === 'pdf') {
        const pdfBuffer = await pdfService.generateTablePDF(reportTitle, headers, rows);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${module}_${Date.now()}.pdf`);
        return res.send(pdfBuffer);
      } else if (format === 'csv' || format === 'excel') {
        const csvContent = convertToCSV(headers, rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=report_${module}_${Date.now()}.csv`);
        return res.send(csvContent);
      } else {
        return ApiResponse.error(res, 'Invalid report format. Allowed: pdf|csv|excel', 400);
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
