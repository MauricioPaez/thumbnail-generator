import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { Credentials } from "aws-sdk";
import AWS = require("aws-sdk");

const UPLOADS_BUCKET = "thumbnail-generator-uploads-bucket";

const credentials = new Credentials({
  accessKeyId: "AKIARYICFF7GXX6RASMO",
  secretAccessKey: "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",
});

const s3 = new AWS.S3({
  signatureVersion: "v4",
  region: "us-east-1",
  credentials: credentials,
});

function getQueryParam(
  paramName: string,
  request: APIGatewayProxyEvent
): string | null {
  let value = request.queryStringParameters
    ? request.queryStringParameters[paramName]
    : null;
  return value || null;
}

export const lambdaHandler = async function (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(event);

  const fileName = getQueryParam("fileName", event);
  const fileType = getQueryParam("fileType", event);
  const fileSize = getQueryParam("fileSize", event);

  //   Validate required parameters
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

  //   Validate conditions
  if (fileType !== "image/png" && fileType !== "image/jpeg") {
    return { statusCode: 417, body: "File type must be PNG or JPEG" };
  }
  if (+fileSize > 5000000) {
    return { statusCode: 417, body: "File size exceeded the 5MB limit" };
  }

  let params = {
    Bucket: UPLOADS_BUCKET,
    Key: fileName,
    Expires: 300,
    ContentType: fileType,
  };

  console.log("getSignedUrl params", params);

  const url = s3.getSignedUrl("putObject", params);

  const proxyResponse: APIGatewayProxyResult = {
    statusCode: 200,
    body: url,
  };

  return proxyResponse;
};
