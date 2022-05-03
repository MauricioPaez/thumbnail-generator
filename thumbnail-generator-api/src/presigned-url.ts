import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { v4 as uuid } from "uuid";

import {
  GetPresignedUrlQueryParameters,
  GetPresignedUrlResponseModel,
  ValidImageTypes,
} from "./types";
import Utils from "./utils";

import AWS = require("aws-sdk");

export const lambdaHandler = async function (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(event);

  const s3 = new AWS.S3({
    signatureVersion: "v4",
    region: process.env.REGION,
  });

  const fileName = Utils.GetQueryParam(
    GetPresignedUrlQueryParameters.FILE_NAME,
    event
  );
  const fileType = Utils.GetQueryParam(
    GetPresignedUrlQueryParameters.FILE_TYPE,
    event
  );
  const fileSize = Utils.GetQueryParam(
    GetPresignedUrlQueryParameters.FILE_SIZE,
    event
  );

  // Validate required parameters
  if (!fileName) {
    return { statusCode: 417, body: "Provide file name" };
  }
  if (!fileType) {
    return { statusCode: 417, body: "Provide file type" };
  }
  if (!fileSize) {
    return { statusCode: 417, body: "Provide file size" };
  }
  if (isNaN(+fileSize)) {
    return { statusCode: 417, body: "Provide valid numeric file size" };
  }

  // Validate conditions
  if (!ValidImageTypes.includes(fileType)) {
    return { statusCode: 417, body: "File type must be PNG or JPEG" };
  }
  if (+fileSize > 5000000) {
    return { statusCode: 417, body: "File size exceeded the 5MB limit" };
  }

  const s3Key = `${fileName}-${uuid()}`;

  let params = {
    Bucket: process.env.UPLOADS_BUCKET_NAME,
    Key: s3Key,
    Expires: 300,
    ContentType: fileType,
  };

  const url = s3.getSignedUrl("putObject", params);

  const responseModel: GetPresignedUrlResponseModel = {
    presignedUrl: url,
    key: s3Key,
  };

  const proxyResponse: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify(responseModel),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  };

  return proxyResponse;
};
