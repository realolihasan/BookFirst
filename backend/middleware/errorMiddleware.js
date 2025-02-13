// Path: backend/middleware/errorMiddleware.js

// Base Error Class
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom Error Classes
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

// Async Handler Utility
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Main Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // JWT Token Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Token expired'
    });
  }

  // Rate Limit Errors
  if (err.name === 'TooManyRequests') {
    return res.status(429).json({
      status: 'fail',
      message: 'Too many requests, please try again later'
    });
  }

  // Network Timeouts
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return res.status(408).json({
      status: 'fail',
      message: 'Request timeout'
    });
  }

  // Azure Blob Storage Errors
  if (err.name === 'StorageError') {
    switch (err.code) {
      case 'BlobNotFound':
        return res.status(404).json({
          status: 'fail',
          message: 'File not found'
        });
      case 'InvalidPermission':
        return res.status(403).json({
          status: 'fail',
          message: 'Access denied to file storage'
        });
      case 'ContainerNotFound':
        return res.status(404).json({
          status: 'fail',
          message: 'Storage container not found'
        });
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          status: 'fail',
          message: 'File size exceeds limit'
        });
      default:
        return res.status(500).json({
          status: 'fail',
          message: 'File storage operation failed'
        });
    }
  }

  // File Upload Errors
  if (err.name === 'MulterError') {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          status: 'fail',
          message: 'File size exceeds limit'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          status: 'fail',
          message: 'Unexpected file upload'
        });
      default:
        return res.status(400).json({
          status: 'fail',
          message: err.message
        });
    }
  }

  // OpenAI API Errors
  if (err.name === 'OpenAIError') {
    switch (err.code) {
      case 'rate_limit_exceeded':
        return res.status(429).json({
          status: 'fail',
          message: 'AI service temporarily unavailable'
        });
      case 'invalid_api_key':
        return res.status(500).json({
          status: 'fail',
          message: 'AI service configuration error'
        });
      case 'context_length_exceeded':
        return res.status(400).json({
          status: 'fail',
          message: 'Input text too long for AI processing'
        });
      default:
        return res.status(500).json({
          status: 'fail',
          message: 'AI service error'
        });
    }
  }

  // Mongoose Errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      details: errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      status: 'fail',
      message: `Duplicate ${field}. Please use another value.`
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Development vs Production Responses
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // Production Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.details && { details: err.details })
    });
  }

  // Unknown Errors
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  catchAsync,
  errorHandler
};