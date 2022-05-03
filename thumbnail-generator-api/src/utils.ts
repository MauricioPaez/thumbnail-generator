import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";

export default class Utils {
  public static GetQueryParam(
    paramName: string,
    request: APIGatewayProxyEvent
  ): string | null {
    let value = request.queryStringParameters
      ? request.queryStringParameters[paramName]
      : null;
    return value || null;
  }
}
