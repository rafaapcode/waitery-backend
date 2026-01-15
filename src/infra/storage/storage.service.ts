import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import * as sentry from '@sentry/nestjs';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { env } from 'src/shared/config/env';

@Injectable()
export class StorageService implements IStorageGw {
  private client: S3Client;
  constructor() {
    this.client = new S3Client({ region: 'us-east-1' });
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

  async uploadFile(
    file: IStorageGw.UploadFileParams,
  ): Promise<IStorageGw.UploadFileOutput> {
    const body_req = {
      size: `${file.size}`,
      orgId: file.orgId,
      ...(file.productId && { productId: file.productId }),
    };
    const command = new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: file.key,
      Body: file.fileBuffer,
      ContentType: file.contentType,
      Metadata: body_req,
      ContentLength: file.size,
    });

    const res = await this.client.send(command);

    const status = res.$metadata.httpStatusCode;

    if (status !== 200) {
      sentry.logger.error(`Error uploading file to S3. Status: ${status}`);
      return { fileKey: '' };
    }

    return {
      fileKey: file.key,
    };
  }
}
