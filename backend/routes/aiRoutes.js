// Path: backend/routes/aiRoutes.js

const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

const handleGeneration = async (req, res, generatorFunction) => {
  try {
    const { existingText } = req.body;
    const result = await generatorFunction(existingText);
    res.json({ text: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

router.post('/generate-bio', async (req, res) => {
  await handleGeneration(req, res, aiService.generateBio.bind(aiService));
});

router.post('/generate-work-description', async (req, res) => {
  await handleGeneration(req, res, aiService.generateWorkDescription.bind(aiService));
});

router.post('/generate-invoice-description', async (req, res) => {
  await handleGeneration(req, res, aiService.generateInvoiceDescription.bind(aiService));
});

module.exports = router;