export enum GetPresignedUrlQueryParameters {
  FILE_NAME = "fileName",
  FILE_TYPE = "fileType",
  FILE_SIZE = "fileSize",
}

export const ValidImageTypes = ["image/png", "image/jpeg"];

export interface GetPresignedUrlResponseModel {
  presignedUrl: string;
  key: string;
}
