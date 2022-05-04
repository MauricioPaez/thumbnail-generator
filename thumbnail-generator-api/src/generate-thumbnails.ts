import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import AWS = require("aws-sdk");
import { GetObjectRequest, PutObjectRequest } from "aws-sdk/clients/s3";
import sharp = require("sharp");
import Utils from "./utils";

interface GenerateThumbnailsResponseModel {
  getObjectSignedUrl400x300: string;
  getObjectSignedUrl160x120: string;
  getObjectSignedUrl120x120: string;
}

export const lambdaHandler = async function (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(event);
  const s3Client = new AWS.S3({
    signatureVersion: "v4",
    region: process.env.REGION,
  });

  let getObjectSignedUrl400x300: string = "";
  let getObjectSignedUrl160x120: string = "";
  let getObjectSignedUrl120x120: string = "";

  let fileS3Key = Utils.GetQueryParam("fileS3Key", event);
  let fileName = Utils.GetQueryParam("fileName", event);

  if (!fileS3Key) {
    return {
      statusCode: 400,
      body: "Missing [fileS3Key] query parameter",
    };
  }

  if (!fileName) {
    return {
      statusCode: 400,
      body: "Missing [fileName] query parameter",
    };
  }

  try {
    // Get original image
    const params: GetObjectRequest = {
      Bucket: process.env.UPLOADS_BUCKET_NAME || "",
      Key: fileS3Key,
    };

    const image = await s3Client.getObject(params).promise();

    if (!image.Body) {
      console.log("Get object request failed", image);
      return {
        statusCode: 400,
        body: "No object found with the provided key",
      };
    }

    // Resize image
    const buffer = Buffer.from(image.Body);
    let resizedImg400x300 = await sharp(buffer, { failOnError: false })
      .resize(400, 300)
      .toFormat("png")
      .toBuffer();
    let resizedImg160x120 = await sharp(buffer, { failOnError: false })
      .resize(160, 120)
      .toFormat("png")
      .toBuffer();
    let resizedImg120x120 = await sharp(buffer, { failOnError: false })
      .resize(120, 120)
      .toFormat("png")
      .toBuffer();

    // Upload to S3
    const key400x300: string = `400x300_${fileName}`;
    let putObjectParams400x300: PutObjectRequest = {
      Bucket: process.env.UPLOADS_BUCKET_NAME || "",
      Key: key400x300,
      Body: resizedImg400x300,
    };
    const key160x120: string = `160x120_${fileName}`;
    let putObjectParams160x120: PutObjectRequest = {
      Bucket: process.env.UPLOADS_BUCKET_NAME || "",
      Key: key160x120,
      Body: resizedImg160x120,
    };
    const key120x120: string = `120x120_${fileName}`;
    let putObjectParams120x120: PutObjectRequest = {
      Bucket: process.env.UPLOADS_BUCKET_NAME || "",
      Key: key120x120,
      Body: resizedImg120x120,
    };

    await s3Client.putObject(putObjectParams400x300).promise();
    await s3Client.putObject(putObjectParams160x120).promise();
    await s3Client.putObject(putObjectParams120x120).promise();

    // Generate GetObject signedUrls
    let getObjectParams400x300 = {
      Bucket: process.env.UPLOADS_BUCKET_NAME,
      Key: key400x300,
      Expires: 300,
    };
    let getObjectParams160x120 = {
      Bucket: process.env.UPLOADS_BUCKET_NAME,
      Key: key160x120,
      Expires: 300,
    };
    let getObjectParams120x120 = {
      Bucket: process.env.UPLOADS_BUCKET_NAME,
      Key: key120x120,
      Expires: 300,
    };

    getObjectSignedUrl400x300 = s3Client.getSignedUrl(
      "getObject",
      getObjectParams400x300
    );
    getObjectSignedUrl160x120 = s3Client.getSignedUrl(
      "getObject",
      getObjectParams160x120
    );
    getObjectSignedUrl120x120 = s3Client.getSignedUrl(
      "getObject",
      getObjectParams120x120
    );
  } catch (error) {
    console.log("Error", error);
    return {
      statusCode: 500,
      body: "Server side error",
    };
  }

  let response: GenerateThumbnailsResponseModel = {
    getObjectSignedUrl400x300: getObjectSignedUrl400x300,
    getObjectSignedUrl160x120: getObjectSignedUrl160x120,
    getObjectSignedUrl120x120: getObjectSignedUrl120x120,
  };

  const proxyResponse: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify(response),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  };

  return proxyResponse;
};
