// Path: backend/services/fileService.js

const { BlobServiceClient } = require('@azure/storage-blob');
const { STORAGE_CONFIG } = require('../config/constants');

class FileService {
  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    this.containers = {};
    this.initializeContainers();
  }

  async initializeContainers() {
    for (const [key, containerName] of Object.entries(STORAGE_CONFIG.CONTAINERS)) {
      this.containers[key] = this.blobServiceClient.getContainerClient(containerName);
      // Ensure container exists
      await this.containers[key].createIfNotExists();
    }
  }

  async uploadImage(file, containerType) {
    try {
      const container = this.containers[containerType];
      if (!container) {
        throw new Error(`Invalid container type: ${containerType}`);
      }

      // Validate file type
      if (!STORAGE_CONFIG.CONTENT_TYPES.IMAGES.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Generate unique blob name
      const blobName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;
      const blockBlobClient = container.getBlockBlobClient(blobName);

      // Upload file
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      });

      // Generate SAS URL
      const sasUrl = await this.generateSasUrl(containerType, blobName);

      return {
        url: sasUrl,
        blobName: blobName,
        contentType: file.mimetype
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadVideo(file, containerType) {
    try {
      const container = this.containers[containerType];
      if (!container) {
        throw new Error(`Invalid container type: ${containerType}`);
      }

      // Validate file type
      if (!STORAGE_CONFIG.CONTENT_TYPES.VIDEOS.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only videos are allowed.');
      }

      // Check file size
      if (file.size > STORAGE_CONFIG.ALLOWED_SIZES.GALLERY_VIDEO) {
        throw new Error('Video file size exceeds limit');
      }

      const blobName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;
      const blockBlobClient = container.getBlockBlobClient(blobName);

      // Upload with automatic content type detection
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      });

      const sasUrl = await this.generateSasUrl(containerType, blobName);

      return {
        url: sasUrl,
        blobName: blobName,
        contentType: file.mimetype
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload video');
    }
  }

  async deleteFile(containerType, blobName) {
    try {
      const container = this.containers[containerType];
      if (!container) {
        throw new Error(`Invalid container type: ${containerType}`);
      }

      const blockBlobClient = container.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  async generateSasUrl(containerType, blobName) {
    try {
      const container = this.containers[containerType];
      if (!container) {
        throw new Error(`Invalid container type: ${containerType}`);
      }

      const blockBlobClient = container.getBlockBlobClient(blobName);

      // Generate SAS token that expires in 24 hours
      const sasToken = await blockBlobClient.generateSasUrl({
        permissions: { read: true },
        expiresOn: new Date(Date.now() + STORAGE_CONFIG.URL_EXPIRY)
      });

      return sasToken;
    } catch (error) {
      console.error('SAS generation error:', error);
      throw new Error('Failed to generate access URL');
    }
  }

  async refreshSasUrl(containerType, blobName) {
    return this.generateSasUrl(containerType, blobName);
  }
}

// Export as singleton
module.exports = new FileService();