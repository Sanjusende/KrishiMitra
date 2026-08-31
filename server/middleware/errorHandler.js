import env from '../config/env.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * Global Exception Interceptor Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let errors = [];

  // Log the unhandled exception using winston/console
  console.error('Unhandled Exception caught by Global Interceptor:', err);

  // 1. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Database Validation Failed';
    errorCode = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // 2. Mongoose Cast Error (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field ${err.path}`;
    errorCode = 'CAST_ERROR';
    errors = [{ field: err.path, message: `Cast to ${err.kind} failed for value "${err.value}"` }];
  }
  // 3. Mongoose Duplicate Key Error
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for: ${field}`;
    errorCode = 'DUPLICATE_KEY_ERROR';
    errors = [{ field, message: `The value "${err.keyValue[field]}" already exists.` }];
  }
  // 4. JWT Verification Error
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid JSON Web Token';
    errorCode = 'INVALID_TOKEN';
  }
  // 5. JWT Expiration Error
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'JSON Web Token has expired';
    errorCode = 'EXPIRED_TOKEN';
  }
  // 6. Multer Upload Error
  else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
    errorCode = 'FILE_UPLOAD_ERROR';
  }

  // Include stack details only in development mode
  if (env.NODE_ENV === 'development' && statusCode === 500) {
    errors.push({ stack: err.stack });
  }

  return ApiResponse.error(res, message, statusCode, errorCode, errors);
};

export default errorHandler;
