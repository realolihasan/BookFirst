// Path: backend/routes/portfolioRoutes.js
const express = require('express');
const { isAuthenticated, isAdmin, isAdminOrCoAdmin } = require('../middleware/authMiddleware');
const { uploadFields } = require('../middleware/uploadMiddleware');
const { validatePortfolio } = require('../middleware/validationMiddleware');
const { catchAsync } = require('../middleware/errorMiddleware');
const portfolioService = require('../services/portfolioService');

const router = express.Router();

//------------------------------------------------------------------------------
// Controller Logic
//------------------------------------------------------------------------------

const createPortfolio = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.createPortfolio(
    req.body,
    req.files,
    req.user.id
  );
  res.status(201).json({
    status: 'success',
    data: portfolio
  });
});

const getAllPortfolios = catchAsync(async (req, res) => {
  const portfolios = await portfolioService.getAllPortfolios(req.query);
  res.status(200).json({
    status: 'success',
    results: portfolios.length,
    data: portfolios
  });
});

const getPortfolio = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.getPortfolio(req.params.id);
  res.status(200).json({
    status: 'success',
    data: portfolio
  });
});

const updatePortfolio = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.updatePortfolio(
    req.params.id,
    req.body,
    req.files
  );
  res.status(200).json({
    status: 'success',
    data: portfolio
  });
});

const deletePortfolio = catchAsync(async (req, res) => {
  await portfolioService.deletePortfolio(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});

const deleteGalleryMedia = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.deleteGalleryMedia(
    req.params.id,
    parseInt(req.params.index)
  );
  res.status(200).json({
    status: 'success',
    data: portfolio
  });
});

const addToGallery = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.addToGallery(req.params.id, req.files);
  res.status(200).json({
    status: 'success', 
    data: portfolio
  });
});

const streamFeaturedImage = catchAsync(async (req, res) => {
  const downloadResponse = await portfolioService.downloadFeaturedImage(req.params.id);
  const contentType = downloadResponse.contentType || 'image/jpeg';
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'public, max-age=300');
  downloadResponse.readableStreamBody.pipe(res);
});

const getGalleryImage = catchAsync(async (req, res) => {
  const portfolio = await portfolioService.getPortfolio(req.params.id);

  if (!portfolio || !portfolio.galleryMedia[req.params.index]) {
    return res.status(404).json({ error: 'Image not found' });
  }

  const media = portfolio.galleryMedia[req.params.index];

  if (media.url) {
    return res.redirect(media.url);
  } else if (media.blobName) {
    const downloadResponse = await portfolioService.downloadGalleryMedia(media.blobName);
    res.set('Content-Type', downloadResponse.contentType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=300');
    return downloadResponse.readableStreamBody.pipe(res);
  }

  return res.status(404).json({ error: 'Image not available' });
});

//------------------------------------------------------------------------------
// Routes
//------------------------------------------------------------------------------

// Public routes
router.get('/', getAllPortfolios);
router.get('/:id', getPortfolio);
router.get('/:id/featured-image', streamFeaturedImage);
router.get('/:id/gallery/:index', getGalleryImage);

// Protected routes
router.use(isAuthenticated);

router.post('/', 
  isAdminOrCoAdmin,
  uploadFields,
  validatePortfolio,
  createPortfolio
);

router.put('/:id',
  isAdminOrCoAdmin,
  uploadFields,
  validatePortfolio,
  updatePortfolio
);

router.post('/:id/gallery', isAdminOrCoAdmin, uploadFields, addToGallery);
router.delete('/:id/gallery/:index', isAdminOrCoAdmin, deleteGalleryMedia);
router.delete('/:id', isAdminOrCoAdmin, deletePortfolio);

module.exports = router;