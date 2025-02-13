// Path: backend/server.js

require('dotenv').config();
console.log("1. Starting server initialization");
console.log("✅ DEBUG: MONGO_URI =", process.env.MONGO_URI);

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Import middleware
const { errorHandler } = require('./middleware/errorMiddleware');
const { upload, uploadFields } = require('./middleware/uploadMiddleware');
const { validatePortfolio, validateContact } = require('./middleware/validationMiddleware');

// Import configurations
const { SESSION_CONFIG, MONGO_CONFIG } = require('./config/constants');
const configurePassport = require('./config/passport');

console.log("2. Dependencies loaded");

// Create Express app
const app = express();

// Create upload directories if they don't exist
const dirs = ['./uploads/invoices', './uploads/statements'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(morgan('dev'));
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use('/api', limiter);

// Session configuration – must be before Passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: SESSION_CONFIG.NAME,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: SESSION_CONFIG.MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    path: '/',
  },
}));

// Initialize passport after session
const passport = configurePassport();
global.passport = passport;
app.use(passport.initialize());
app.use(passport.session());

console.log("3. Middleware setup complete");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, MONGO_CONFIG);
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Mount routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const aiRoutes = require('./routes/aiRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const emailRoutes = require('./routes/emailRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api', emailRoutes);


// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log("4. Routes mounted");

// 3. Serve the frontend build folder
app.use(express.static(path.join(__dirname, 'frontend_dist')));

// 4. Catch-all route to serve index.html for any non-API request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend_dist', 'index.html'));
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    auth: {
      passport: !!passport,
      session: !!req.session,
      strategies: Object.keys(passport._strategies)
    }
  });
});

// Error handling middleware - must be last
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`5. Server listening on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
});

module.exports = { app, passport };