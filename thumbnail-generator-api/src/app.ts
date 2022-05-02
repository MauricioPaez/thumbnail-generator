import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import sharp = require("sharp");

interface File {
  name: string;
  type: string;
  size: number;
}

interface GenerateThumbnailsRequestModel {
  file: File;
}

export const lambdaHandler = async function (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(event);
  let resizedImg = null;

  if (event.body) {
    const requestModel: GenerateThumbnailsRequestModel = JSON.parse(event.body);

    if (
      requestModel.file.type !== "image/png" &&
      requestModel.file.type !== "jpeg"
    ) {
      return { statusCode: 417, body: "File type must be PNG or JPEG" };
    }

    if (requestModel.file.size > 5000000) {
      return { statusCode: 417, body: "File size exceeded the 5MB limit" };
    }

    resizedImg = await sharp(event.body).resize(400, 300).toFormat('png').toBuffer()

  } else {
    return {
      statusCode: 400,
      body: "Empty body. Please refer to API documentation",
    };
  }

  const proxyResponse: APIGatewayProxyResult = {
    statusCode: 200,
    body: resizedImg
      ? Buffer.from(resizedImg).toString("base64")
      : "Unable to transform file",
    isBase64Encoded: true,
  };

  return proxyResponse;
};
