jest.mock('src/shared/config/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-key',
    REFRESH_JWT_SECRET: 'test-refresh-jwt-secret',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CEP_SERVICE_API_URL: 'https://test-cep-api.com',
    CDN_URL: 'https://test-cdn.com',
    BUCKET_NAME: 'test-bucket',
    NODE_ENV: 'test',
  },
}));

import { S3Client } from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let storageService: StorageService;
  let sendSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
    sendSpy = jest.spyOn(S3Client.prototype, 'send');
  });

  afterEach(() => {
    sendSpy.mockRestore();
  });

  it('All services must be defined', () => {
    expect(storageService).toBeDefined();
    expect(sendSpy).toBeDefined();
  });

  it('should return a file_key when the upload is successful', async () => {
    // Arrange
    sendSpy.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    });
    const image_file = {
      buffer: Buffer.from('test file content'),
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    // Act
    const result = await storageService.uploadFile({
      contentType: image_file.mimetype,
      fileBuffer: image_file.buffer,
      orgId: 'org123',
      key: 'organization/org123/test-image.png',
      size: image_file.size,
    });

    // Assert
    expect(sendSpy).toHaveBeenCalled();
    expect(result).toEqual({ fileKey: 'organization/org123/test-image.png' });
  });

  it('should not return a file_key when the upload is unsuccessful', async () => {
    // Arrange
    sendSpy.mockResolvedValue({
      $metadata: { httpStatusCode: 500 },
    });
    const image_file = {
      buffer: Buffer.from('test file content'),
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    // Act
    const result = await storageService.uploadFile({
      contentType: image_file.mimetype,
      fileBuffer: image_file.buffer,
      orgId: 'org123',
      key: 'organization/org123/test-image.png',
      size: image_file.size,
    });

    // Assert
    expect(sendSpy).toHaveBeenCalled();
    expect(result).toEqual({ fileKey: '' });
  });

  it('should return a success when the file is deleted', async () => {
    // Arrange
    sendSpy.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    });

    // Act
    const result = await storageService.deleteFile({
      key: 'organization/org123/test-image.png',
    });

    // Assert
    expect(sendSpy).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('should not return a success when the file is not deleted', async () => {
    // Arrange
    sendSpy.mockResolvedValue({
      $metadata: { httpStatusCode: 500 },
    });

    // Act
    const result = await storageService.deleteFile({
      key: 'organization/org123/test-image.png',
    });

    // Assert
    expect(sendSpy).toHaveBeenCalled();
    expect(result).toEqual({ success: false });
  });

  it('should not return a success when the key is not provided', async () => {
    // Arrange
    sendSpy.mockResolvedValue({
      $metadata: { httpStatusCode: 500 },
    });

    // Act
    const result = await storageService.deleteFile({
      key: '',
    });

    // Assert
    expect(sendSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false });
  });

  it('should generate key with productId when provided', () => {
    // Arrange
    const params = {
      orgId: 'org-123',
      productId: 'prod-456',
      filename: 'test-image.jpg',
    };

    // Act
    const result = storageService.getFileKey(params);

    // Assert
    expect(result).toBe('organization/org-123/product/prod-456/test-image.jpg');
  });

  it('should generate key without productId when not provided', () => {
    // Arrange
    const params = {
      orgId: 'org-789',
      filename: 'logo.png',
    };

    // Act
    const result = storageService.getFileKey(params);

    // Assert
    expect(result).toBe('organization/org-789/logo.png');
  });

  it('should handle special characters in filename', () => {
    // Arrange
    const params = {
      orgId: 'org-abc',
      filename: 'test file (1).jpg',
    };

    // Act
    const result = storageService.getFileKey(params);

    // Assert
    expect(result).toBe('organization/org-abc/test_file_(1).jpg');
  });

  it('should generate correct path for different organization IDs', () => {
    // Arrange
    const params = {
      orgId: 'my-org-12345',
      productId: 'product-xyz',
      filename: 'banner.webp',
    };

    // Act
    const result = storageService.getFileKey(params);

    // Assert
    expect(result).toBe(
      'organization/my-org-12345/product/product-xyz/banner.webp',
    );
  });
});
