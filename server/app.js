import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import env from './config/env.js';
import corsOptions from './config/cors.js';
import loggerMiddleware from './config/logger.js';
import errorHandler from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import irrigationRoutes from './routes/irrigationRoutes.js';
import cropHealthRoutes from './routes/cropHealthRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import cropRecommendationRoutes from './routes/cropRecommendationRoutes.js';

import {
  authLimiter,
  voiceLimiter,
  weatherLimiter,
  analyticsLimiter,
  generalLimiter,
} from './middleware/rateLimiter.js';

// Optional compression middleware loader
let compressionMiddleware = (req, res, next) => next();
try {
  const compressionModule = await import('compression');
  compressionMiddleware = (compressionModule.default || compressionModule)();
} catch (e) {
  // Safe fallback if compression package is not yet installed in node_modules
}

const app = express();

// Disable x-powered-by signature
app.disable('x-powered-by');

// Production-ready Helmet security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'sameorigin' },
    noSniff: true,
  })
);

const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.JWT_SECRET,
  cookieName: '__Host-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
});

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(doubleCsrfProtection);
app.use(compressionMiddleware);
app.use(loggerMiddleware);

// Parse JSON payloads up to 5MB (protect against oversized payload attacks)
app.use(express.json({ limit: '5mb' }));

// Parse URL-encoded payloads up to 5MB (protect against oversized payload attacks)
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Prevent NoSQL query injection by stripping operator keys in-place (Express 5 safe)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// Prevent cross-site scripting (XSS) attacks by sanitizing request inputs in-place (Express 5 safe)
const cleanXSS = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object') {
        cleanXSS(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) cleanXSS(req.body);
  if (req.params) cleanXSS(req.params);
  if (req.query) cleanXSS(req.query);
  next();
});

// Prevent HTTP parameter pollution
app.use(hpp());

// Health Check Routes
const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartFarm API Running',
  });
});

app.get('/api/csrf-token', (req, res) => {
  res.json({
    csrfToken: generateToken(req, res),
  });
});
app.get('/api/health', generalLimiter, healthCheck);
app.get('/api/v1/health', generalLimiter, healthCheck);

// Swagger Documentation Route mount point
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Authentication Routes mount points
// app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', authLimiter, doubleCsrfProtection, authRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);

// Farm Routes mount points
app.use('/api/farms', generalLimiter, farmRoutes);
app.use('/api/v1/farms', generalLimiter, farmRoutes);

// Feature Engine Route Mount Points
app.use('/api/weather', weatherLimiter, weatherRoutes);
app.use('/api/v1/weather', weatherLimiter, weatherRoutes);

app.use('/api/irrigation', generalLimiter, irrigationRoutes);
app.use('/api/v1/irrigation', generalLimiter, irrigationRoutes);

app.use('/api/crop-health', cropHealthRoutes);
app.use('/api/v1/crop-health', cropHealthRoutes);

app.use('/api/market', generalLimiter, marketRoutes);
app.use('/api/v1/market', generalLimiter, marketRoutes);

app.use('/api/dashboard', analyticsLimiter, dashboardRoutes);
app.use('/api/v1/dashboard', analyticsLimiter, dashboardRoutes);

app.use('/api/voice', voiceLimiter, voiceRoutes);
app.use('/api/v1/voice', voiceLimiter, voiceRoutes);

app.use('/api/crop-recommendation', generalLimiter, cropRecommendationRoutes);
app.use('/api/v1/crop-recommendation', generalLimiter, cropRecommendationRoutes);


// 404 Route Handler Middleware
app.use((req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.errorCode = 'ROUTE_NOT_FOUND';
  next(error);
});

// Global Error Handler Middleware (MUST be mounted last)
app.use(errorHandler);

export default app;
