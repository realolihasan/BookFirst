// Path: backend/services/portfolioService.js

const Portfolio = require('../models/Portfolio');
const { STORAGE_CONFIG } = require('../config/constants');
const { ValidationError, NotFoundError } = require('../middleware/errorMiddleware');
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential
} = require('@azure/storage-blob');
const { Readable } = require('stream');

// Helper to extract credentials from connection string
function extractFromConnectionString(connectionString) {
  const matchAccount = connectionString.match(/AccountName=([^;]+)/);
  const matchKey = connectionString.match(/AccountKey=([^;]+)/);
  return {
    accountName: matchAccount ? matchAccount[1] : null,
    accountKey: matchKey ? matchKey[1] : null
  };
}

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("❌ AZURE_STORAGE_CONNECTION_STRING is missing in .env.");
}

const { accountName, accountKey } = extractFromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
if (!accountName || !accountKey) {
  throw new Error("❌ Azure Storage credentials are missing. Check AZURE_STORAGE_CONNECTION_STRING.");
}
console.log("✅ DEBUG: Extracted Azure Storage Credentials:", { accountName });

// Initialize Blob Service Client
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new StorageSharedKeyCredential(accountName, accountKey)
);

class PortfolioService {
  constructor() {
    this.blobServiceClient = blobServiceClient;
    this.containers = {};
    this.sasCache = {};
    this.ready = this.initializeContainers();
  }

  async initializeContainers() {
    try {
      for (const [key, containerName] of Object.entries(STORAGE_CONFIG.CONTAINERS)) {
        this.containers[containerName] = this.blobServiceClient.getContainerClient(containerName);
        await this.containers[containerName].createIfNotExists();
      }
      console.log("✅ DEBUG: Successfully initialized Azure Blob Containers:", Object.keys(this.containers));
    } catch (error) {
      console.error("❌ Error initializing containers:", error);
      throw error;
    }
  }

  async generateSasUrl(containerType, blobName) {
    await this.ready;
    const containerName = STORAGE_CONFIG.CONTAINERS[containerType];
    if (!containerName || !this.containers[containerName]) {
      console.error("❌ ERROR: Invalid container type:", containerType);
      console.error("✅ DEBUG: Available containers:", Object.keys(this.containers));
      throw new Error(`Container '${containerType}' is not defined.`);
    }
    const cached = this.sasCache[blobName];
    const now = new Date();
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }
    const interval = 5 * 60 * 1000; // 5 minutes
    const fixedExpiry = new Date(Math.floor(now.getTime() / interval) * interval + 30 * 60 * 1000);
    const container = this.containers[containerName];
    const blockBlobClient = container.getBlockBlobClient(blobName);
    const permissions = new BlobSASPermissions();
    permissions.read = true;
    try {
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: container.containerName,
          blobName: blobName,
          permissions: permissions,
          expiresOn: fixedExpiry,
        },
        new StorageSharedKeyCredential(accountName, accountKey)
      ).toString();
      const url = `${blockBlobClient.url}?${sasToken}`;
      this.sasCache[blobName] = { url, expiresAt: fixedExpiry };
      return url;
    } catch (error) {
      console.error("❌ Error generating SAS URL:", error);
      throw error;
    }
  }

  async uploadToBlob(file, containerType) {
    await this.ready;
    const containerName = STORAGE_CONFIG.CONTAINERS[containerType];
    if (!containerName || !this.containers[containerName]) {
      throw new Error(`Container '${containerType}' is not defined.`);
    }
    const container = this.containers[containerName];
    const isVideo = STORAGE_CONFIG.CONTENT_TYPES.VIDEOS.includes(file.mimetype);
    console.log("Uploading file:", file.originalname, "with mimetype:", file.mimetype, "isVideo:", isVideo);
    const allowedTypes = isVideo ? STORAGE_CONFIG.CONTENT_TYPES.VIDEOS : STORAGE_CONFIG.CONTENT_TYPES.IMAGES;
    console.log("Allowed types for this file:", allowedTypes);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }
    const sizeLimit = isVideo ? STORAGE_CONFIG.ALLOWED_SIZES.GALLERY_VIDEO : STORAGE_CONFIG.ALLOWED_SIZES.GALLERY_IMAGE;
    if (file.size > sizeLimit) {
      throw new ValidationError(`File size exceeds ${sizeLimit / (1024 * 1024)}MB limit.`);
    }
    const blobName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;
    const blockBlobClient = container.getBlockBlobClient(blobName);
    const stream = Readable.from(file.buffer);
    await blockBlobClient.uploadStream(stream, 4 * 1024 * 1024, 5, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });
    const sasUrl = await this.generateSasUrl(containerType, blobName);
    const result = {
      url: sasUrl,
      blobName,
      contentType: file.mimetype,
      type: isVideo ? 'video' : 'image'
    };
    console.log("File uploaded with result:", result);
    return result;
  }

  async createPortfolio(data, files, userId) {
    await this.ready;
    console.log("Creating portfolio with data:", data, "and files:", files, "userId:", userId);
    
    if (!files.featuredImage?.[0]) {
      throw new ValidationError('Featured image is required');
    }
    
    let featuredImage;
    try {
      featuredImage = await this.uploadToBlob(files.featuredImage[0], 'FEATURED_IMAGES');
      console.log("Featured image uploaded:", featuredImage);
    } catch (error) {
      console.error("Error uploading featured image:", error);
      throw error;
    }
    
    const galleryMedia = [];
    if (files.galleryMedia) {
      if (files.galleryMedia.length > STORAGE_CONFIG.MAX_GALLERY_IMAGES) {
        throw new ValidationError(`Maximum ${STORAGE_CONFIG.MAX_GALLERY_IMAGES} gallery items allowed`);
      }
      for (const file of files.galleryMedia) {
        try {
          const media = await this.uploadToBlob(file, 'GALLERY_IMAGES');
          console.log("Gallery media uploaded:", media);
          galleryMedia.push(media);
        } catch (error) {
          console.error("Error uploading gallery media:", error);
          throw error;
        }
      }
    }
    
    const portfolio = new Portfolio({
      ...data,
      featuredImage,
      galleryMedia,
      createdBy: userId
    });
    console.log("Saving portfolio document:", portfolio);
    try {
      await portfolio.save();
      console.log("Portfolio saved successfully:", portfolio);
    } catch (error) {
      console.error("Error saving portfolio:", error);
      throw error;
    }
    return portfolio;
  }

  async getAllPortfolios(filters = {}) {
    await this.ready;
    console.log("Fetching all portfolios with filters:", filters);
    const query = { isActive: true, ...filters };
    const portfolios = await Portfolio.find(query)
      .sort('-createdAt')
      .populate('createdBy', 'name email');

    await Promise.all(
      portfolios.map(async portfolio => {
        if (portfolio.featuredImage?.blobName) {
          portfolio.featuredImage.url = await this.generateSasUrl('FEATURED_IMAGES', portfolio.featuredImage.blobName);
        }
        await Promise.all(
          portfolio.galleryMedia.map(async media => {
            media.url = await this.generateSasUrl('GALLERY_IMAGES', media.blobName);
          })
        );
      })
    );
    console.log("Fetched portfolios:", portfolios.map(p => p.id));
    return portfolios;
  }

  async getPortfolio(id) {
    await this.ready;
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }
    if (portfolio.featuredImage?.blobName) {
      portfolio.featuredImage.url = await this.generateSasUrl('FEATURED_IMAGES', portfolio.featuredImage.blobName);
    }
    await Promise.all(
      portfolio.galleryMedia.map(async media => {
        media.url = await this.generateSasUrl('GALLERY_IMAGES', media.blobName);
      })
    );
    return portfolio;
  }

  async updatePortfolio(id, data, files) {
    await this.ready;
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }
    if (files.featuredImage?.[0]) {
      if (portfolio.featuredImage?.blobName) {
        await this.deleteBlob('FEATURED_IMAGES', portfolio.featuredImage.blobName);
      }
      portfolio.featuredImage = await this.uploadToBlob(files.featuredImage[0], 'FEATURED_IMAGES');
    }
    if (files.galleryMedia?.length) {
      const totalItems = portfolio.galleryMedia.length + files.galleryMedia.length;
      if (totalItems > STORAGE_CONFIG.MAX_GALLERY_IMAGES) {
        throw new ValidationError(`Maximum ${STORAGE_CONFIG.MAX_GALLERY_IMAGES} gallery items allowed`);
      }
      const newMedia = await Promise.all(
        files.galleryMedia.map(file => this.uploadToBlob(file, 'GALLERY_IMAGES'))
      );
      portfolio.galleryMedia.push(...newMedia);
    }
    Object.keys(data).forEach(key => {
      if (key !== 'featuredImage' && key !== 'galleryMedia') {
        portfolio[key] = data[key];
      }
    });
    await portfolio.save();
    return portfolio;
  }

  async deletePortfolio(id) {
    await this.ready;
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }
    if (portfolio.featuredImage?.blobName) {
      await this.deleteBlob('FEATURED_IMAGES', portfolio.featuredImage.blobName);
    }
    await Promise.all(
      portfolio.galleryMedia.map(media =>
        this.deleteBlob('GALLERY_IMAGES', media.blobName)
      )
    );
    await portfolio.deleteOne();
    return { message: 'Portfolio deleted successfully' };
  }

  async addToGallery(portfolioId, files) {
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }
  
    if (!files?.galleryMedia?.length) {
      throw new ValidationError('No files uploaded');
    }
  
    // Check total count won't exceed limit
    const totalCount = portfolio.galleryMedia.length + files.galleryMedia.length;
    if (totalCount > STORAGE_CONFIG.MAX_GALLERY_ITEMS) {
      throw new ValidationError(`Maximum ${STORAGE_CONFIG.MAX_GALLERY_ITEMS} gallery items allowed`);
    }
  
    // Upload each new file
    const uploadPromises = files.galleryMedia.map(file => 
      this.uploadToBlob(file, 'GALLERY_IMAGES')
    );
  
    const uploadedFiles = await Promise.all(uploadPromises);
    portfolio.galleryMedia.push(...uploadedFiles);
    
    await portfolio.save();
    return portfolio;
  }

  async downloadGalleryMedia(blobName) {
    await this.ready;
    const containerName = STORAGE_CONFIG.CONTAINERS.GALLERY_IMAGES;
    if (!containerName || !this.containers[containerName]) {
      throw new Error(`Container 'GALLERY_IMAGES' is not defined.`);
    }
  
    const container = this.containers[containerName];
    const blockBlobClient = container.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();
  
    return {
      readableStreamBody: downloadResponse.readableStreamBody,
      contentType: downloadResponse.contentType || 'image/jpeg'
    };
  }
  

  async deleteGalleryMedia(portfolioId, index) {
    await this.ready;
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }
    if (!portfolio.galleryMedia[index]) {
      throw new NotFoundError('Gallery media not found at specified index');
    }
    await this.deleteBlob('GALLERY_IMAGES', portfolio.galleryMedia[index].blobName);
    portfolio.galleryMedia.splice(index, 1);
    await portfolio.save();
    return portfolio;
  }

  async deleteBlob(containerType, blobName) {
    await this.ready;
    const containerName = STORAGE_CONFIG.CONTAINERS[containerType];
    if (!containerName || !this.containers[containerName]) {
      throw new Error(`Container '${containerType}' is not defined in STORAGE_CONFIG.CONTAINERS.`);
    }
    const container = this.containers[containerName];
    const blockBlobClient = container.getBlockBlobClient(blobName);
    try {
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error(`Error deleting blob ${blobName}:`, error);
      throw error;
    }
  }

  async downloadFeaturedImage(id) {
    await this.ready;
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }
    if (!portfolio.featuredImage || !portfolio.featuredImage.blobName) {
      throw new NotFoundError('Featured image not found');
    }
    const containerName = STORAGE_CONFIG.CONTAINERS.FEATURED_IMAGES;
    if (!containerName || !this.containers[containerName]) {
      throw new Error(`Container 'FEATURED_IMAGES' is not defined.`);
    }
    const container = this.containers[containerName];
    const blockBlobClient = container.getBlockBlobClient(portfolio.featuredImage.blobName);
    const downloadResponse = await blockBlobClient.download();
    return downloadResponse;
  }
}

module.exports = new PortfolioService();
