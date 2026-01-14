export interface IStorageGw {
  getUploadPresignedUrl: (
    file: IStorageGw.GetUploadPresignedUrlParams,
  ) => Promise<IStorageGw.GetUploadPresignedUrlOutput>;
  deleteFile: (
    filePath: IStorageGw.DeleteFileParams,
  ) => Promise<IStorageGw.DeleteFileOutput>;
  getFileKey: (
    params: IStorageGw.GetFileKeyParams,
  ) => IStorageGw.GetFileKeyOutput;
}

export namespace IStorageGw {
  export type GetUploadPresignedUrlParams = {
    key: string;
    contentType: string;
    size: number;
    orgId: string;
    productId?: string;
  };
  export type GetUploadPresignedUrlOutput = {
    url: string;
  };
  export type DeleteFileParams = {
    key: string;
  };
  export type DeleteFileOutput = {
    success: boolean;
  };
  export type GetFileKeyParams = {
    orgId: string;
    filename: string;
    productId?: string;
  };
  export type GetFileKeyOutput = string;
}
