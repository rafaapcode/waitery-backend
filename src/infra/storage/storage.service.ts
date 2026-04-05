import { Injectable } from '@nestjs/common';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';
import { env } from 'src/shared/config/env';
import { Agent, request } from 'undici';
import { ObservabilityService } from '../observability/observability.service';

@Injectable()
export class StorageService implements IStorageGw {
  constructor(private readonly observabilityService: ObservabilityService) {}

  async deleteFile(
    filePath: IStorageGw.DeleteFileParams,
  ): Promise<IStorageGw.DeleteFileOutput> {
    if (!filePath.key) {
      this.observabilityService.error(
        'StorageService',
        'File key is required to delete a file from S3.',
        'No stack found',
      );
      return { success: false };
    }

    let presignedUrl: string | null = null;
    try {
      const lambdaPayload = {
        key: filePath.key,
        type: 'delete',
      };

      const lambdaRes = await request(env.LAMBDA_PRESIGNED_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lambdaPayload),
      });
      const lambdaJson = (await lambdaRes.body.json()) as { url: string };
      presignedUrl = lambdaJson.url;
      if (!presignedUrl) {
        this.observabilityService.error(
          'StorageService',
          'Presigned URL not returned from Lambda (delete).',
          'No stack found',
        );
        return { success: false };
      }
    } catch (err) {
      this.observabilityService.error(
        'StorageService',
        `Error requesting presigned URL for delete: ${(err as Error).message}`,
        (err as Error).stack || 'No stack found',
      );
      return { success: false };
    }

    try {
      const deleteRes = await request(presignedUrl, {
        method: 'DELETE',
      });
      if (deleteRes.statusCode < 200 || deleteRes.statusCode >= 300) {
        this.observabilityService.error(
          'StorageService',
          `Error deleting file from S3 via presigned URL. Status: ${deleteRes.statusCode}`,
          'No stack found',
        );
        return { success: false };
      }
    } catch (err) {
      this.observabilityService.error(
        'StorageService',
        `Error deleting file from S3 via presigned URL: ${(err as Error).message}`,
        (err as Error).stack || 'No stack found',
      );
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

    let presignedUrl: string | null = null;

    try {
      const lambdaPayload = {
        key: file.key,
        type: 'upload',
        metadata: body_req,
        contentType: file.contentType,
        contentLength: file.fileBuffer.length.toString(),
      };
      const lambdaRes = await request(env.LAMBDA_PRESIGNED_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lambdaPayload),
      });
      const lambdaJson = (await lambdaRes.body.json()) as { url: string };
      presignedUrl = lambdaJson.url;
      if (!presignedUrl) {
        this.observabilityService.error(
          'StorageService',
          'Presigned URL not returned from Lambda.',
          'No stack found',
        );
        return { fileKey: '' };
      }
    } catch (err) {
      this.observabilityService.error(
        'StorageService',
        `Error requesting presigned URL: ${(err as Error).message}`,
        (err as Error).stack || 'No stack found',
      );
      return { fileKey: '' };
    }

    try {
      const uploadRes = await request(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.contentType,
        },
        body: file.fileBuffer,
        dispatcher: new Agent({
          keepAliveTimeout: 10,
          keepAliveMaxTimeout: 10,
        }),
      });
      if (uploadRes.statusCode < 200 || uploadRes.statusCode >= 300) {
        this.observabilityService.error(
          'StorageService',
          `Error uploading file to S3 via presigned URL. Status: ${uploadRes.statusCode}`,
          'No stack found',
        );
        return { fileKey: '' };
      }
    } catch (err) {
      console.log('caiu aqui deu eruim', err);
      this.observabilityService.error(
        'StorageService',
        `Error uploading file to S3 via presigned URL: ${(err as Error).message}`,
        (err as Error).stack || 'No stack found',
      );
      return { fileKey: '' };
    }

    return {
      fileKey: file.key,
    };
  }
}
