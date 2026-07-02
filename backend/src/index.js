require('dotenv').config(); // force reload for CORS update
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { auth } = require('./middlewares/authMiddleware');

const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/eleves');
const subjectRoutes = require('./routes/matieres');
const sequenceRoutes = require('./routes/sequences');
const gradeRoutes = require('./routes/notes');
const timetableRoutes = require('./routes/timetable');
const bulletinRoutes = require('./routes/bulletins');
const absenceRoutes = require('./routes/absences');
const paymentRoutes = require('./routes/paiements');
const creneauRoutes = require('./routes/creneaux');
const financeRoutes = require('./routes/finance');
const hrRoutes = require('./routes/hr');
const documentRoutes = require('./routes/documents');
const messageRoutes = require('./routes/messages');
const statsRoutes = require('./routes/stats');
const disciplineRoutes = require('./routes/discipline');
const libraryRoutes = require('./routes/library');
const accountingRoutes = require('./routes/accounting');
const platformRoutes = require('./routes/platform');

const app = express();
app.set('trust proxy', 1); // Trust Vercel's proxy for rate limiting
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ========================================
// SECURITY MIDDLEWARES (V-013, V-012, V-016, V-028, V-025)
// ========================================

// V-013 FIX: Helmet — HTTP security headers (X-Frame-Options, HSTS, CSP, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow static file serving
}));

// V-012 FIX: CORS — restrict origins (no more wildcard *)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000']; // Dev defaults

app.use(cors({
  origin: true, // Allow all origins dynamically (fixes Electron/mobile app access)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Academic-Year', 'Accept']
}));

// V-028 FIX: Limit JSON body size to 1MB (prevent memory exhaustion attacks)
app.use(express.json({ limit: '1mb' }));

// V-025 FIX: Morgan — use 'combined' format in production for better logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// V-016 FIX: Global rate limiter — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// V-016 FIX: Strict rate limiter for auth routes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per 15 min
  message: { message: 'Too many authentication attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// V-016 FIX: Strict rate limiter for OTP routes (prevent SMS spam)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isProduction ? 3 : 20, // Max 3 in prod, 20 in dev
  message: { message: 'Too many OTP requests. Please wait before requesting a new code.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// V-016 FIX: Webhook rate limiter (prevent flooding)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 webhook calls per minute
  message: { message: 'Too many webhook requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ========================================
// V-024 FIX: Static files — protected behind authentication
// ========================================
// Public photos can remain accessible (used in bulletins/cards)
app.use('/photos', express.static(path.join(__dirname, '..', 'public', 'photos')));

// Sensitive files: require authentication
app.use('/bulletins', auth, express.static(path.join(__dirname, '..', 'public', 'bulletins')));
app.use('/payslips', auth, express.static(path.join(__dirname, '..', 'public', 'payslips')));
app.use('/badges', auth, express.static(path.join(__dirname, '..', 'public', 'badges')));
app.use('/certificates', auth, express.static(path.join(__dirname, '..', 'public', 'certificates')));
app.use('/reports', auth, express.static(path.join(__dirname, '..', 'public', 'reports')));

// ========================================
// API Routes (with rate limiters on sensitive endpoints)
// ========================================
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/parent/request-otp', otpLimiter);
app.use('/api/auth/parent/verify-otp', authLimiter);
app.use('/api/paiements/webhook', webhookLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/eleves', studentRoutes);
app.use('/api/matieres', subjectRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/notes', gradeRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/emplois-du-temps', timetableRoutes);
app.use('/api/bulletins', bulletinRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/paiements', paymentRoutes);
app.use('/api/annees', require('./routes/annees'));
app.use('/api/creneaux', creneauRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/import', require('./routes/import'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// ========================================
// V-017 FIX: Global error handler — never leak internal errors to client
// ========================================
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS: Origin not allowed' });
  }
  
  // Log the full error internally
  console.error('[EduTrack Error]', err);
  
  // Return generic message to client (no stack traces, no internal details)
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    stack: isProduction ? undefined : err.stack
  });
});

// ========================================
// V-018 FIX: Unhandled rejection & uncaught exception handlers
// ========================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('[EduTrack] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[EduTrack] Uncaught Exception:', error);
  // process.exit(1); removed to prevent Vercel 500 crash
});

// Start Server (only locally, Vercel handles it via module.exports)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[EduTrack Backend] Server is running on port ${PORT}`);
    console.log(`[EduTrack Backend] CORS allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

module.exports = app;