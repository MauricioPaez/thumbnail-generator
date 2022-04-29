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
  let responseBody = null;

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

    responseBody = await Promise.all([
      sharp(requestModel.file as any)
        .resize(400, 300)
        .toBuffer(),
      sharp(requestModel.file as any)
        .resize(160, 120)
        .toBuffer(),
      sharp(requestModel.file as any)
        .resize(120, 120)
        .toBuffer(),
    ]);
  } else {
    return {
      statusCode: 400,
      body: "Empty body. Please refer to API documentation",
    };
  }

  const proxyResponse: APIGatewayProxyResult = {
    statusCode: 200,
    body: responseBody
      ? Buffer.from(JSON.stringify(responseBody)).toString("base64")
      : "Unable to transform file",
    isBase64Encoded: true,
  };

  return proxyResponse;
};
