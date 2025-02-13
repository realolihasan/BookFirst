// Path: backend/config/constants.js

// User Roles - Update
const USER_ROLES = {
  ADMIN: 'admin',
  CO_ADMIN: 'co_admin', 
  MODEL: 'model',          
  PUBLIC: 'public'
};


// Booking related constants
const BF_STATUS = {
  REQUESTED : 'requested', // Request Sent by a brand (booking form submitted)
  CONFIRMED: 'confirmed', // Request confirmed by admoin or co-admin
  PAID : 'paid', // Brand Paid - updated by admin. (Used for payment to individual model or co-admin too)
  PENDING: 'pending', // Job pending for the model. (Used for payment to individual model or co-admin too)
  COMPLETED: 'completed', // Job completed by the model - updated by admin/co-admin
  CANCELLED: 'cancelled' // Brand, Admin or Co-Admin cancels it. 
};

const DURATION_UNITS = {
  HOURS: 'hours',
  DAYS: 'days'
};

// Model Expertise Types
const MODEL_EXPERTISE = {
  CATWALK: 'Catwalk',
  HIGH_FASHION: 'High Fashion',
  CATALOG: 'Catalog',
  INFLUENCER: 'Influencer',
  ACTING: 'Acting',
  FITNESS: 'Fitness',
  GLAMOUR: 'Glamour'
};

// File Upload Constants
const UPLOAD_CONSTANTS = {
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_MEDIA_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
  MAX_GALLERY_IMAGES: 25,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  BUCKET_NAME: 'uploads'
};

// Validation Constants
const VALIDATION = {
  NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
  WORK_DETAILS_MAX_LENGTH: 1000,
  MODEL_MEASUREMENTS: {
    HEIGHT_MIN: 100,
    HEIGHT_MAX: 220,
    WEIGHT_MIN: 35,
    WEIGHT_MAX: 120,
    CHEST_MIN: 10,
    CHEST_MAX: 150,
    WAIST_MIN: 10,
    WAIST_MAX: 120
  },
  INSTAGRAM_HANDLE_REGEX: /^[a-zA-Z0-9._]{1,30}$/,
  EMAIL_REGEX: /^\S+@\S+\.\S+$/
};

// Model Names (for MongoDB refs)
const MODEL_NAMES = {
  USER: 'User',
  PORTFOLIO: 'Portfolio',
  BOOKING: 'Booking',           
};
// Storage Configuration (Azure Blob)
const STORAGE_CONFIG = {
  CONTAINERS: {
    FEATURED_IMAGES: 'models-featured-images',
    GALLERY_IMAGES: 'models-gallery-images',
      INVOICES: 'booking-invoices',
  PAYOUTS: 'booking-payouts'
  },
  ALLOWED_SIZES: {
    FEATURED_IMAGE: 5 * 1024 * 1024, // 5MB
    GALLERY_IMAGE: 10 * 1024 * 1024, // 10MB
    GALLERY_VIDEO: 100 * 1024 * 1024 // 100MB
  },
  URL_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours for SAS tokens
  CONTENT_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
    VIDEOS: ['video/mp4', 'video/webm']
  }
};

// MongoDB Configuration
const MONGO_CONFIG = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tlsAllowInvalidCertificates: true,
  retryWrites: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

// Session Configuration
const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  NAME: 'connect.sid'
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
};

// Cache Configuration
const CACHE_CONFIG = {
  PUBLIC_ASSETS_MAX_AGE: '1d'
};

// AI Configuration
const AI_CONFIG = {
  TOKEN_TO_CHAR_RATIO: 4,
  MAX_BIO_CHARS: 250,
  MAX_GRAMMAR_CHECK_CHARS: 150,
  MODEL: 'gpt-4',
  TEMPERATURE: 0.7
};


module.exports = {
  USER_ROLES,
  BF_STATUS,
  DURATION_UNITS,
  MODEL_EXPERTISE,
  UPLOAD_CONSTANTS,
  VALIDATION,
  MONGO_CONFIG,
  SESSION_CONFIG,
  RATE_LIMIT,
  CACHE_CONFIG,
  AI_CONFIG,
  MODEL_NAMES,
  STORAGE_CONFIG
};