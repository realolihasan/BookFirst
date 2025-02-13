// Path: backend/middleware/authMiddleware.js

const { AuthError, ForbiddenError } = require('./errorMiddleware');
const { USER_ROLES } = require('../config/constants');

// Basic authentication check
const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }
  next();
};

// Check for specific role
const hasRole = (role) => (req, res, next) => {
  if (!req.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }
  if (req.user.role !== role && req.user.role !== USER_ROLES.ADMIN) {
    throw new ForbiddenError(`${role} access required`);
  }
  next();
};

// Check for multiple allowed roles
const hasAnyRole = (roles) => (req, res, next) => {
  if (!req.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }
  if (!roles.includes(req.user.role) && req.user.role !== USER_ROLES.ADMIN) {
    throw new ForbiddenError('Insufficient permissions');
  }
  next();
};

// Admin only access
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }
  if (req.user.role !== USER_ROLES.ADMIN) {
    throw new ForbiddenError('Admin access required');
  }
  next();
};

// Admin or Co-Admin access
const isAdminOrCoAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }
  if (req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.CO_ADMIN) {
    throw new ForbiddenError('Admin or Co-Admin access required');
  }
  next();
};

// Model accessing their own portfolio/bookings
const isModelOwner = (req, res, next) => {
  if (!req.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }
  
  if (req.user.role !== USER_ROLES.MODEL) {
    throw new ForbiddenError('Model access required');
  }

  // Check if the requested portfolio/booking belongs to the model
  const requestedId = req.params.id || req.body.portfolioId;
  if (req.user.portfolioId?.toString() !== requestedId) {
    throw new ForbiddenError('Access denied to this resource');
  }
  
  next();
};

const Booking = require('../models/Booking');

// Brand accessing their own bookings
const isBrandOwner = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }
  
  if (req.user.role !== USER_ROLES.BRAND) {
    throw new ForbiddenError('Brand access required');
  }

  const requestedBookingId = req.params.id || req.body.bookingId;
  const booking = await Booking.findById(requestedBookingId);
  
  if (!booking || booking.brandId.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('Access denied to this booking');
  }

  next();
};

module.exports = {
  isAuthenticated,
  hasRole,
  hasAnyRole,
  isAdmin,
  isAdminOrCoAdmin,
  isModelOwner,
  isBrandOwner
};