// Path: backend/models/User.js

const mongoose = require('mongoose');
const { MODEL_NAMES, USER_ROLES, VALIDATION } = require('../config/constants');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [VALIDATION.EMAIL_REGEX, 'Please provide a valid email address'],
    index: true
  },

  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [VALIDATION.NAME_MAX_LENGTH, `Name cannot exceed ${VALIDATION.NAME_MAX_LENGTH} characters`]
  },

  picture: {
    type: String,
    trim: true
  },

  role: {
    type: String,
    enum: {
      values: Object.values(USER_ROLES),
      message: '{VALUE} is not a supported role'
    },
    default: USER_ROLES.PUBLIC,
    index: true
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  // Portfolio reference for models
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODEL_NAMES.PORTFOLIO,
    sparse: true
  },

  // Stripe connection for receiving payments (models & co-admins)
  stripeConnectId: {
    type: String,
    sparse: true,
    index: true
  },

  // Work history for models
  workHistory: [{
    jobId: String,
    date: Date,
    client: String,
    location: {
      streetAddress: String,
      city: String,
      country: String
    },
    payment: {
      invoiceId: String,
      paymentId: String,
      amount: Number,
      currency: {
        type: String,
        default: 'EUR'
      },
      status: {
        type: String,
        enum: ['PENDING', 'PAID'],
        default: 'PENDING'
      },
      paidAt: Date
    }
  }],

  lastLogin: {
    type: Date
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  emailVerified: {
    type: Boolean,
    default: false
  },

  registeredAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.googleId; // Don't expose OAuth IDs
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1, googleId: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Instance methods
userSchema.methods.isAdmin = function() {
  return this.role === USER_ROLES.ADMIN;
};

userSchema.methods.isCoAdmin = function() {
  return this.role === USER_ROLES.CO_ADMIN;
};

userSchema.methods.isModel = function() {
  return this.role === USER_ROLES.MODEL;
};

userSchema.methods.isBrand = function() {
  return this.role === USER_ROLES.BRAND;
};

userSchema.methods.canReceivePayments = function() {
  return (this.role === USER_ROLES.MODEL || this.role === USER_ROLES.CO_ADMIN) && this.stripeConnectId;
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toJSON();
  delete obj.googleId;
  delete obj.stripeConnectId;
  delete obj.workHistory;
  return obj;
};

// Static methods
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

userSchema.statics.findAdmins = function() {
  return this.find({ role: USER_ROLES.ADMIN, isActive: true });
};

userSchema.statics.findModels = function() {
  return this.find({ role: USER_ROLES.MODEL, isActive: true });
};

userSchema.statics.findCoAdmins = function() {
  return this.find({ role: USER_ROLES.CO_ADMIN, isActive: true });
};

userSchema.statics.findBrands = function() {
  return this.find({ role: USER_ROLES.BRAND, isActive: true });
};

// Middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const User = mongoose.model(MODEL_NAMES.USER, userSchema);

module.exports = User;