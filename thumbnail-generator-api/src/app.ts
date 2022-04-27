export const lambdaHandler = async function (
  event: any = {},
  context: any
): Promise<any> {
  return { statusCode: 201, body: "Hello from AWS CDK and SAM!" };
};
