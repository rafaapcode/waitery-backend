export interface IStorageGw {
  saveFile: (
    file: IStorageGw.SaveFileParams,
  ) => Promise<IStorageGw.SaveFileOutput>;
  deleteFile: (
    filePath: IStorageGw.DeleteFileParams,
  ) => Promise<IStorageGw.DeleteFileOutput>;
  getFileKey: (
    params: IStorageGw.GetFileKeyParams,
  ) => IStorageGw.GetFileKeyOutput;
}

export namespace IStorageGw {
  export type SaveFileParams = {
    fileBuffer: Buffer;
    key: string;
    contentType: string;
    size: number;
    orgId: string;
    productId?: string;
  };
  export type SaveFileOutput = {
    fileUrl: string;
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
