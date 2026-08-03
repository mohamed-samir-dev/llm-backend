const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const config = require('./config');
const errorHandler = require('./middlewares/error.middleware');
const routes = require('./routes');

const app = express();

// ─── Security Middlewares ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { status: 'fail', message: 'طلبات كثيرة جداً. يرجى المحاولة لاحقاً' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'fail', message: 'محاولات كثيرة جداً. يرجى المحاولة بعد 15 دقيقة' },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ─── General Middlewares ─────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // Prevent NoSQL injection

if (config.env === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.all('/api/ext/*', (req, res) => res.status(200).json({}));
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env }));

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({ status: 'fail', message: `المسار ${req.originalUrl} غير موجود` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
