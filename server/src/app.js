const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const visitRoutes = require('./routes/visitRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const procedureRequestRoutes = require('./routes/procedureRequestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const laboratoryRoutes = require('./routes/laboratoryRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const settingRoutes = require('./routes/settingRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/+$/, ''))
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, Postman, wildcard, or listed origins
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview URLs if any Vercel domain is listed
    if (allowedOrigins.some(ao => ao.includes('vercel.app')) && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Permissive fallback so legitimate client visits aren't blocked
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth rate limiter to protect against brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.'
  }
});
app.use('/api/auth', authLimiter);

const initDatabase = require('./config/initDatabase');
const { sequelize } = require('./models');

// Database readiness middleware for cold starts (essential for Vercel Serverless)
app.use(async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }
  try {
    await initDatabase();
    next();
  } catch (err) {
    console.error('Database Initialization Middleware Error:', err);
    return res.status(500).json({
      success: false,
      message: `Database connection or initialization error: ${err.message || 'Unknown error'}`
    });
  }
});

// API Health Check
const healthHandler = async (req, res) => {
  try {
    let dbStatus = 'connected';
    try {
      await sequelize.authenticate();
    } catch (e) {
      dbStatus = 'disconnected: ' + e.message;
    }
    return res.json({
      status: 'healthy',
      database: dbStatus,
      dialect: sequelize?.getDialect ? sequelize.getDialect() : 'unknown',
      timestamp: new Date().toISOString(),
      service: 'Tena Clinic Management System API'
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount Routes (support both /api/* and /* paths for universal deployment compatibility)
const routeList = [
  { path: 'auth', router: authRoutes },
  { path: 'patients', router: patientRoutes },
  { path: 'visits', router: visitRoutes },
  { path: 'consultations', router: consultationRoutes },
  { path: 'services', router: serviceRoutes },
  { path: 'procedure-requests', router: procedureRequestRoutes },
  { path: 'payments', router: paymentRoutes },
  { path: 'laboratory', router: laboratoryRoutes },
  { path: 'prescriptions', router: prescriptionRoutes },
  { path: 'appointments', router: appointmentRoutes },
  { path: 'reports', router: reportRoutes },
  { path: 'users', router: userRoutes },
  { path: 'settings', router: settingRoutes }
];

routeList.forEach(({ path, router }) => {
  app.use(`/api/${path}`, router);
  app.use(`/${path}`, router);
});

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
