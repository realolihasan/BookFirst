// Path: backend/routes/bookingRoutes.js

const express = require('express');
const { catchAsync } = require('../middleware/errorMiddleware');
const { isAuthenticated, isAdminOrCoAdmin } = require('../middleware/authMiddleware');
const bookingService = require('../services/bookingService');

const router = express.Router();

//------------------------------------------------------------------------------
// Controller Logic
//------------------------------------------------------------------------------

const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.body);
  res.status(201).json({
    status: 'success',
    data: booking
  });
});

const getBookings = catchAsync(async (req, res) => {
  let bookings;
  
  if (req.user.role === 'model') {
    bookings = await bookingService.getBookingsByModel(req.user.portfolioId);
  } else {
    // Admin or Co-admin gets all bookings
    bookings = await bookingService.getBookings(req.query);
  }

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: bookings
  });
});

const getBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.getBooking(req.params.id);
  
  // Only check model authorization
  if (req.user.role === 'model' && !booking.portfolios.includes(req.user.portfolioId)) {
    throw new Error('Not authorized to view this booking');
  }

  res.status(200).json({
    status: 'success',
    data: booking
  });
});

const updateBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBooking(
    req.params.id,
    req.body,
    req.user.id
  );
  res.status(200).json({
    status: 'success',
    data: booking
  });
});

const updateBookingStatus = catchAsync(async (req, res) => {
  const booking = await bookingService.updateBookingStatus(
    req.params.id,
    req.body.status,
    req.user.id
  );
  res.status(200).json({
    status: 'success',
    data: booking
  });
});

//------------------------------------------------------------------------------
// Routes
//------------------------------------------------------------------------------

// Public route - no authentication needed
router.post('/', createBooking);

// Protected routes - require authentication
router.use(isAuthenticated);
router.get('/', getBookings);
router.get('/:id', getBooking);

// Admin/Co-admin only routes
router.use(isAdminOrCoAdmin);
router.put('/:id', updateBooking);
router.put('/:id/status', updateBookingStatus);

module.exports = router;