import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

  async deleteFile(
    filePath: IStorageGw.DeleteFileParams,
  ): Promise<IStorageGw.DeleteFileOutput> {
    if (!filePath.key) {
      sentry.logger.error('File key is required to delete a file from S3.');
      return { success: false };
    }

    const command = new DeleteObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: filePath.key,
    });

    const res = await this.client.send(command);

    const status = res.$metadata.httpStatusCode;

    if (status !== 200) {
      sentry.logger.error(`Error deleting file from S3. Status: ${status}`);
      return { success: false };
    }

    return { success: true };
  }

  getFileKey(params: IStorageGw.GetFileKeyParams): IStorageGw.GetFileKeyOutput {
    const { orgId, productId, filename } = params;
    if (productId) {
      const key = `organization/${orgId}/product/${productId}/${filename.replace(/ /g, '_')}`;
      return key;
    }
    const key = `organization/${orgId}/${filename.replace(/ /g, '_')}`;
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
