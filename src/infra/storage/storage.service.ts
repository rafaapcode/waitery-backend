import { Injectable } from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { env } from 'src/shared/config/env';
import { request } from 'undici';

@Injectable()
export class StorageService implements IStorageGw {
  async saveFile(
    file: IStorageGw.SaveFileParams,
  ): Promise<IStorageGw.SaveFileOutput> {
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
      },
    );

    if (statusCode !== 200) {
      sentry.logger.error('Failed to get presigned URL', { statusCode });
      return { fileUrl: '' };
    }

    const data = await body.json();
    console.log('Presigned URL data:', data);
    return {
      fileUrl: 'https://example.com/fake-file-url',
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
}
