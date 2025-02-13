// Path: backend/routes/invoiceRoutes.js

const express = require('express');
const { catchAsync } = require('../middleware/errorMiddleware');
const { isAuthenticated, isAdminOrCoAdmin } = require('../middleware/authMiddleware');
const invoiceService = require('../services/invoiceService');

const router = express.Router();

// Generate invoice
router.post('/generate/:bookingId', 
  isAuthenticated, 
  isAdminOrCoAdmin,
  catchAsync(async (req, res) => {
    const { html, pdfBuffer, invoiceNumber } = await invoiceService.generateInvoice(
      req.params.bookingId,
      req.body
    );

    res.json({
      status: 'success',
      data: {
        html,
        invoiceNumber
      }
    });
  })
);

// Download invoice as PDF
router.get('/download/:bookingId',
  isAuthenticated,
  isAdminOrCoAdmin,
  catchAsync(async (req, res) => {
    const { pdfBuffer, invoiceNumber } = await invoiceService.generateInvoice(
      req.params.bookingId,
      req.query
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  })
);

module.exports = router;