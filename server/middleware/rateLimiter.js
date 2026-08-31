import rateLimit from 'express-rate-limit';
import ApiResponse from '../utils/apiResponse.js';

// Helper to create rate limiter with standardized error response
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return ApiResponse.error(res, message, 429, 'RATE_LIMIT_EXCEEDED');
    },
  });
};

// 1. Authentication routes (highly sensitive)
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  10, // Limit to 10 requests per window
  'Too many authentication attempts. Please try again after 15 minutes.'
);

// 2. Voice assistant route (sensitive API & model calls)
export const voiceLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  30, // Limit to 30 requests per window
  'Too many voice assistant queries. Please try again after 15 minutes.'
);

// 3. Crop Health / Disease Uploads (heavy image processing & bandwidth)
export const uploadLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  20, // Limit to 20 uploads per window
  'Too many image uploads. Please try again after 15 minutes.'
);

// 4. Weather APIs (external API calls)
export const weatherLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  50, // Limit to 50 requests per window
  'Too many weather requests. Please try again after 15 minutes.'
);

// 5. Analytics (Dashboard summaries)
export const analyticsLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  60, // Limit to 60 requests per window
  'Too many dashboard refresh requests. Please try again after 15 minutes.'
);

// 6. General API Rate Limiter
export const generalLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  100, // Limit to 100 requests per window
  'Too many requests. Please try again after 15 minutes.'
);

// 7. Admin Panel — General API limiter (all protected admin routes)
export const adminLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  120, // Limit to 120 requests per window
  'Too many admin API requests. Please try again after 15 minutes.'
);

// 8. Admin Panel — Login / Register (highly sensitive, strict)
export const adminAuthLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  5, // Only 5 login/register attempts per IP per window
  'Too many admin authentication attempts. Please try again after 15 minutes.'
);

