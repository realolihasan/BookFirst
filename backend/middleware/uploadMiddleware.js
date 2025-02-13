// Path: backend/middleware/uploadMiddleware.js

const multer = require('multer');
const { ValidationError } = require('./errorMiddleware');
const { STORAGE_CONFIG } = require('../config/constants');

// Use memory storage so files are kept in memory (adjust if you prefer disk storage)
const storage = multer.memoryStorage();

// Define a file filter to check file types and sizes
const fileFilter = (req, file, cb) => {
  const isImage = STORAGE_CONFIG.CONTENT_TYPES.IMAGES.includes(file.mimetype);
  const isVideo = STORAGE_CONFIG.CONTENT_TYPES.VIDEOS.includes(file.mimetype);

  if (!isImage && !isVideo) {
    return cb(new ValidationError('Invalid file type'), false);
  }

  // Set max size based on whether the file is a video or an image
  const maxSize = isVideo
    ? STORAGE_CONFIG.ALLOWED_SIZES.GALLERY_VIDEO
    : STORAGE_CONFIG.ALLOWED_SIZES.GALLERY_IMAGE;

  if (file.size > maxSize) {
    return cb(
      new ValidationError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`),
      false
    );
  }

  cb(null, true);
};

// Create the Multer upload instance with the defined storage, file filter, and limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Set the maximum file size to the largest possible (gallery video size)
    fileSize: STORAGE_CONFIG.ALLOWED_SIZES.GALLERY_VIDEO,
    // Limit the total number of files based on your configuration
    files: STORAGE_CONFIG.MAX_GALLERY_ITEMS
  }
});

// Configure the fields to be uploaded:
// - "featuredImage": a single file (maxCount: 1)
// - "galleryMedia": up to MAX_GALLERY_ITEMS files
const uploadFields = upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'galleryMedia', maxCount: STORAGE_CONFIG.MAX_GALLERY_ITEMS }
]);

module.exports = {
  upload,
  uploadFields
};
