import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { doubleCsrf } from 'csrf-csrf';
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
import adminRoutes from './admin/routes/adminRoutes.js';

import {
  authLimiter,
  voiceLimiter,
  weatherLimiter,
  analyticsLimiter,
  generalLimiter,
  adminLimiter,
  adminAuthLimiter,
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

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(compressionMiddleware);
app.use(loggerMiddleware);

// Parse JSON payloads up to 5MB (protect against oversized payload attacks)
app.use(express.json({ limit: '5mb' }));

// Parse URL-encoded payloads up to 5MB (protect against oversized payload attacks)
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Express 5 compatibility layer: redefine req.query as writable to allow express-mongo-sanitize mutation
app.use((req, res, next) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true
  });
  next();
});

// Prevent NoSQL query injection globally (CodeQL requirement)
app.use(mongoSanitize());

// Configure stateless double-submit CSRF protection
const { doubleCsrfProtection, generateCsrfToken: generateToken } = doubleCsrf({
  getSecret: () => env.JWT_SECRET || 'fallback_csrf_secret_key_2026',
  getSessionIdentifier: (req) => {
    return req.cookies?.accessToken || req.cookies?.token || 'anonymous';
  },
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
  },
  getTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'] || (req.body && req.body._csrf);
  },
});

// Wrapper middleware to support Bearer token authentication bypass for CSRF
const csrfMiddleware = (req, res, next) => {
  // 1. Bypass CSRF for Bearer token authenticated requests (JWT in headers is safe from CSRF)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // 2. Bypass CSRF for public auth endpoints (login, register, token refresh, password resets)
  const bypassUrls = [
    '/login',
    '/register',
    '/refresh-token',
    '/forgot-password',
    '/reset-password'
  ];
  if (bypassUrls.some(url => req.path.endsWith(url))) {
    return next();
  }

  // 3. Bypass CSRF if there are no session cookies to forge
  const hasAuthCookies = !!(req.cookies?.accessToken || req.cookies?.token || req.cookies?.refreshToken);
  if (!hasAuthCookies) {
    return next();
  }

  // 4. Otherwise, enforce double-submit CSRF protection
  return doubleCsrfProtection(req, res, next);
};

// Protect cookie-based state-mutating requests against CSRF
app.use(csrfMiddleware);

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
app.get('/api/health', generalLimiter, healthCheck);
app.get('/api/v1/health', generalLimiter, healthCheck);

// CSRF Token Retrieval Route
app.get('/api/csrf-token', (req, res) => {
  const token = generateToken(req, res);
  return res.json({ success: true, csrfToken: token });
});

// Swagger Documentation Route mount point
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Authentication Routes mount points
app.use('/api/auth', authLimiter, authRoutes);
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

// Admin Subsystem Routes (rate-limited)
// Auth endpoints get a strict limiter; all other admin API calls get a general admin limiter
app.use('/api/admin/auth', adminAuthLimiter);
app.use('/api/admin', adminLimiter, adminRoutes);

// Global Error Handler Middleware (MUST be mounted last)
app.use(errorHandler);

export default app;
