// backend/routes/emailRoutes.js

const express = require('express');
const { catchAsync } = require('../middleware/errorMiddleware');
const emailService = require('../services/emailService');

const router = express.Router();

router.post('/send-email', catchAsync(async (req, res) => {
  const result = await emailService.sendContactEmail(req.body);
  res.status(200).json({
    status: 'success',
    data: result
  });
}));

module.exports = router;