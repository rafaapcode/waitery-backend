jest.mock('undici', () => ({
  request: jest.fn(),
  Agent: jest.fn().mockImplementation(() => ({})),
}));

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
    LAMBDA_PRESIGNED_URL:
      'https://tests.lambda.region.amazonaws.com/generate-presigned-url',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { request } from 'undici';
import { ObservabilityService } from '../observability/observability.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let storageService: StorageService;
  let observabilityService: ObservabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, ObservabilityService],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
    observabilityService =
      module.get<ObservabilityService>(ObservabilityService);
  });

  it('All services must be defined', () => {
    expect(storageService).toBeDefined();
    expect(observabilityService).toBeDefined();
  });

  it('should return a file_key when the upload is successful', async () => {
    // Arrange
    const image_file = {
      buffer: Buffer.from('test file content'),
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    // Mock request para presigned URL e upload
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        body: {
          json: async () =>
            Promise.resolve({ url: 'https://presigned-upload-url' }),
        },
      }),
    );
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ statusCode: 200 }),
    );

    // Act
    const result = await storageService.uploadFile({
      contentType: image_file.mimetype,
      fileBuffer: image_file.buffer,
      orgId: 'org123',
      key: 'organization/org123/test-image.png',
      size: image_file.size,
    });

    // Assert
    expect(result).toEqual({ fileKey: 'organization/org123/test-image.png' });
  });

  it('should not return a file_key when the upload is unsuccessful', async () => {
    // Arrange
    const image_file = {
      buffer: Buffer.from('test file content'),
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File;

    // Mock request para presigned URL e upload (upload falha)
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        body: {
          json: async () =>
            Promise.resolve({ url: 'https://presigned-upload-url' }),
        },
      }),
    );
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ statusCode: 500 }),
    );

    // Act
    const result = await storageService.uploadFile({
      contentType: image_file.mimetype,
      fileBuffer: image_file.buffer,
      orgId: 'org123',
      key: 'organization/org123/test-image.png',
      size: image_file.size,
    });

    // Assert
    expect(result).toEqual({ fileKey: '' });
  });

  it('should return a success when the file is deleted', async () => {
    // Mock request para presigned URL e deleção
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        body: {
          json: async () =>
            Promise.resolve({ url: 'https://presigned-delete-url' }),
        },
      }),
    );
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ statusCode: 204 }),
    );

    // Act
    const result = await storageService.deleteFile({
      key: 'organization/org123/test-image.png',
    });

    // Assert
    expect(result).toEqual({ success: true });
  });

  it('should not return a success when the file is not deleted', async () => {
    // Mock request para presigned URL e deleção (deleção falha)
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        body: {
          json: async () =>
            Promise.resolve({ url: 'https://presigned-delete-url' }),
        },
      }),
    );
    (request as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ statusCode: 500 }),
    );

    // Act
    const result = await storageService.deleteFile({
      key: 'organization/org123/test-image.png',
    });

    // Assert
    expect(result).toEqual({ success: false });
  });

  it('should not return a success when the key is not provided', async () => {
    // Act
    const result = await storageService.deleteFile({
      key: '',
    });

    // Assert
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
