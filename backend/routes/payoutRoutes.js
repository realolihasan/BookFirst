// Path: backend/routes/payoutRoutes.js

const express = require('express');
const { catchAsync } = require('../middleware/errorMiddleware');
const { isAuthenticated, isAdminOrCoAdmin } = require('../middleware/authMiddleware');
const payoutService = require('../services/payoutService');
const Booking = require('../models/Booking');
const { ValidationError } = require('../middleware/errorMiddleware');

const router = express.Router();

// Generate payout statement
router.post('/generate/:bookingId', 
  isAuthenticated, 
  isAdminOrCoAdmin,
  catchAsync(async (req, res) => {
    try {
      if (!req.body.userId || !req.body.percentage) {
        throw new ValidationError('User ID and percentage are required');
      }

      const { pdfBuffer, statementNumber } = await payoutService.generatePayoutStatement(
        req.params.bookingId,
        {
          userId: req.body.userId,
          percentage: parseFloat(req.body.percentage)
        }
      );

      res.json({
        status: 'success',
        data: {
          statementNumber
        }
      });
    } catch (err) {
      console.error('Payout generation error:', err);
      res.status(400).json({
        status: 'error',
        message: err.message || 'Failed to generate payout statement'
      });
    }
  })
);

// Rest of the routes remain the same
router.get('/download/:bookingId/:recipientId',
  isAuthenticated,
  catchAsync(async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.bookingId);
      
      if (!booking) {
        throw new ValidationError('Booking not found');
      }

      const statement = booking.payoutStatements.find(
        ps => ps.recipientId.toString() === req.params.recipientId
      );

      if (!statement) {
        throw new ValidationError('Payout statement not found');
      }

      if (!(req.user.role === 'admin' || 
            req.user.role === 'co_admin' || 
            req.user._id.toString() === req.params.recipientId)) {
        throw new ValidationError('Not authorized to download this statement');
      }

      const { pdfBuffer, statementNumber } = await payoutService.downloadPayoutStatement(
        req.params.bookingId,
        req.params.recipientId
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payout-${statementNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('Statement download error:', err);
      res.status(400).json({
        status: 'error',
        message: err.message || 'Failed to download statement'
      });
    }
  })
);

router.put('/:bookingId/status',
  isAuthenticated,
  isAdminOrCoAdmin,
  catchAsync(async (req, res) => {
    const booking = await payoutService.updatePayoutStatus(
      req.params.bookingId,
      req.body.recipientId,
      req.body.status,
      req.user._id
    );

    res.json({
      status: 'success',
      data: booking
    });
  })
);

module.exports = router;