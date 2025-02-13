// Path: backend/models/Portfolio.js

const mongoose = require('mongoose');
const { 
  MODEL_NAMES, 
  MODEL_EXPERTISE, 
  VALIDATION, 
  STORAGE_CONFIG,
  UPLOAD_CONSTANTS 
} = require('../config/constants');

const portfolioSchema = new mongoose.Schema({
  modelName: { 
    type: String, 
    required: [true, 'Model name is required'],
    trim: true,
    maxlength: [VALIDATION.NAME_MAX_LENGTH, `Model name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters`],
    index: true
  },

  expertise: {
    type: String,
    enum: {
      values: Object.values(MODEL_EXPERTISE),
      message: '{VALUE} is not a supported expertise'
    },
    required: [true, 'Expertise is required'],
    index: true
  },

  height: { 
    type: Number, 
    required: [true, 'Height is required'],
    min: [VALIDATION.MODEL_MEASUREMENTS.HEIGHT_MIN, `Height must be at least ${VALIDATION.MODEL_MEASUREMENTS.HEIGHT_MIN}cm`],
    max: [VALIDATION.MODEL_MEASUREMENTS.HEIGHT_MAX, `Height cannot exceed ${VALIDATION.MODEL_MEASUREMENTS.HEIGHT_MAX}cm`]
  },

  weight: { 
    type: Number, 
    required: [true, 'Weight is required'],
    min: [VALIDATION.MODEL_MEASUREMENTS.WEIGHT_MIN, `Weight must be at least ${VALIDATION.MODEL_MEASUREMENTS.WEIGHT_MIN}kg`],
    max: [VALIDATION.MODEL_MEASUREMENTS.WEIGHT_MAX, `Weight cannot exceed ${VALIDATION.MODEL_MEASUREMENTS.WEIGHT_MAX}kg`]
  },

  chest: { 
    type: Number, 
    required: [true, 'Chest measurement is required'],
    min: [VALIDATION.MODEL_MEASUREMENTS.CHEST_MIN, `Chest must be at least ${VALIDATION.MODEL_MEASUREMENTS.CHEST_MIN}cm`],
    max: [VALIDATION.MODEL_MEASUREMENTS.CHEST_MAX, `Chest cannot exceed ${VALIDATION.MODEL_MEASUREMENTS.CHEST_MAX}cm`]
  },

  waist: { 
    type: Number, 
    required: [true, 'Waist measurement is required'],
    min: [VALIDATION.MODEL_MEASUREMENTS.WAIST_MIN, `Waist must be at least ${VALIDATION.MODEL_MEASUREMENTS.WAIST_MIN}cm`],
    max: [VALIDATION.MODEL_MEASUREMENTS.WAIST_MAX, `Waist cannot exceed ${VALIDATION.MODEL_MEASUREMENTS.WAIST_MAX}cm`]
  },

  instagramHandle: { 
    type: String,
    trim: true,
    match: [VALIDATION.INSTAGRAM_HANDLE_REGEX, 'Please provide a valid Instagram handle']
  },

  bio: { 
    type: String, 
    maxlength: [VALIDATION.BIO_MAX_LENGTH, `Bio cannot exceed ${VALIDATION.BIO_MAX_LENGTH} characters`],
    trim: true
  },

  featuredImage: {
    url: {
      type: String,
      required: [true, 'Featured image URL is required']
    },
    blobName: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true,
      enum: {
        values: STORAGE_CONFIG.CONTENT_TYPES.IMAGES,
        message: '{VALUE} is not a supported image type'
      }
    }
  },

  galleryMedia: [{
    url: {
      type: String,
      required: true
    },
    blobName: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true,
      enum: {
        values: [...STORAGE_CONFIG.CONTENT_TYPES.IMAGES, ...STORAGE_CONFIG.CONTENT_TYPES.VIDEOS],
        message: '{VALUE} is not a supported media type'
      }
    },
    type: {
      type: String,
      required: true,
      enum: ['image', 'video']
    }
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.USER,
    required: [true, 'Creator reference is required'],
    index: true
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
portfolioSchema.index({ modelName: 'text', bio: 'text' });
portfolioSchema.index({ expertise: 1, createdAt: -1 });

// Maximum number of gallery media items
portfolioSchema.path('galleryMedia').validate(function(value) {
  return value.length <= UPLOAD_CONSTANTS.MAX_GALLERY_IMAGES;
}, `Gallery cannot have more than ${UPLOAD_CONSTANTS.MAX_GALLERY_IMAGES} items`);

// Virtual for media count
portfolioSchema.virtual('mediaCount').get(function() {
  return this.galleryMedia ? this.galleryMedia.length : 0;
});

// Instance method to check if portfolio is complete
portfolioSchema.methods.isComplete = function() {
  return !!(
    this.modelName &&
    this.expertise &&
    this.height &&
    this.weight &&
    this.chest &&
    this.waist &&
    this.featuredImage
  );
};

// Static method to find active portfolios by expertise
portfolioSchema.statics.findByExpertise = function(expertise) {
  return this.find({ 
    expertise, 
    isActive: true 
  }).sort('-createdAt');
};

// Create the model
const Portfolio = mongoose.model(MODEL_NAMES.PORTFOLIO, portfolioSchema);

module.exports = Portfolio;