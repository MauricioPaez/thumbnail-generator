import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

type FileType = "png" | "jpeg" | "jpg";

interface GenerateThumbnailsRequestModel {
  fileName: string;
  fileType: FileType;
  file: any;
}

export const lambdaHandler = async function (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(event);

  if (event.body) {
    const requestModel: GenerateThumbnailsRequestModel = JSON.parse(event.body);

    if (
      requestModel.fileType !== "png" &&
      requestModel.fileType !== "jpeg" &&
      requestModel.fileType !== "jpg"
    ) {
      return { statusCode: 417, body: "File type must be PNG, JPEG or JPG" };
    }
  } else {
    return {
      statusCode: 400,
      body: "Empty body. Please refer to API documentation",
    };
  }

  return { statusCode: 201, body: "Hello from AWS CDK and SAM!" };
};
