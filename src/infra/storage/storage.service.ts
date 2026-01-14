import { Injectable } from '@nestjs/common';
import { IStorageGw } from 'src/core/application/contracts/storageGw/IStorageGw';

@Injectable()
export class StorageService implements IStorageGw {
  constructor() {}

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
      key: file.key,
      content_type: file.contentType,
      size: `${file.size}`,
      orgId: file.orgId,
      ...(file.productId && { productId: file.productId }),
    };

    return {
      fileKey: '',
    };
  }
}
