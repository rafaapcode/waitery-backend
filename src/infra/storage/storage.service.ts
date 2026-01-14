import { Injectable } from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { env } from 'src/shared/config/env';
import { FormData, request } from 'undici';

@Injectable()
export class StorageService implements IStorageGw {
  async saveFile(
    file: IStorageGw.SaveFileParams,
  ): Promise<IStorageGw.SaveFileOutput> {
    const { uploadSignature, fileKey } = await this.getPresignedUrl(file);
    if (!uploadSignature) {
      sentry.logger.error('No upload signature received');
      return { fileKey: '' };
    }
    const { url, fields } = this.decodeBase64(uploadSignature);

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });

    formData.append('file', file.fileBuffer);

    const { statusCode } = await request(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (statusCode !== 200) {
      sentry.logger.error('Failed to upload file to S3', { statusCode });
      return { fileKey: '' };
    }

    return {
      fileKey: fileKey,
    };
  }

  deleteFile: (
    filePath: IStorageGw.DeleteFileParams,
  ) => Promise<IStorageGw.DeleteFileOutput>;

  getFileKey(params: IStorageGw.GetFileKeyParams): IStorageGw.GetFileKeyOutput {
    const { orgId, productId, filename } = params;
    if (productId) {
      const key = `organization/${orgId}/product/${productId}/${filename}`;
      return key;
    }
    const key = `organization/${orgId}/${filename}`;
    return key;
  }

  private decodeBase64(fileBase64: string): {
    url: string;
    fields: Record<string, string>;
  } {
    const decoded = Buffer.from(fileBase64, 'base64').toString('utf-8');

    const parsed = JSON.parse(decoded) as {
      url: string;
      fields: Record<string, string>;
    };
    return parsed;
  }

  private async getPresignedUrl(
    file: IStorageGw.SaveFileParams,
  ): Promise<{ uploadSignature: string; fileKey: string }> {
    const body_req = {
      key: file.key,
      content_type: file.contentType,
      size: file.size,
      orgId: file.orgId,
      productId: file.productId,
    };

    const { statusCode, body } = await request(
      env.PRESIGNED_URL_SERVICE_API_URL,
      {
        method: 'POST',
        body: JSON.stringify(body_req),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (statusCode !== 200) {
      sentry.logger.error('Failed to get presigned URL', { statusCode });
      return {
        uploadSignature: '',
        fileKey: '',
      };
    }

    const data = (await body.json()) as { uploadSignature: string };

    return {
      uploadSignature: data.uploadSignature,
      fileKey: file.key,
    };
  }
}
