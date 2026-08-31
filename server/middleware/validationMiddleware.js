import { validationResult } from 'express-validator';
import ApiResponse from '../utils/apiResponse.js';

/**
 * Middleware to intercept validation errors and respond in unified format
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(
      res,
      'Input Validation Failed',
      422,
      'VALIDATION_ERROR',
      errors.array()
    );
  }
  next();
};
