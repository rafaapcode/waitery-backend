import { Injectable } from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { env } from 'src/shared/config/env';
import { request } from 'undici';

@Injectable()
export class StorageService implements IStorageGw {
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

  async getUploadPresignedUrl(
    file: IStorageGw.GetUploadPresignedUrlParams,
  ): Promise<{ url: string; fileKey: string }> {
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
        url: '',
        fileKey: '',
      };
    }

    const data = (await body.json()) as { url: string };

    return {
      url: data.url,
      fileKey: file.key,
    };
  }
}
