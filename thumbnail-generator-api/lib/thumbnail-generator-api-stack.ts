import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";

export class ThumbnailGeneratorApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const thumbnailGeneratorFunction = new Function(
      this,
      "ThumbnailGenerator",
      {
        runtime: Runtime.NODEJS_14_X,
        handler: "app.lambdaHandler",
        code: Code.fromAsset("./src"),
      }
    );

    const thumbnailGeneratorRestApi = new LambdaRestApi(
      this,
      "thumbnailGeneratorRestApi",
      {
        restApiName: "Thumbnail Generator API",
        handler: thumbnailGeneratorFunction,
        proxy: false,
      }
    );

    const generator = thumbnailGeneratorRestApi.root.addResource("generate");

    generator.addMethod(
      "POST",
      new LambdaIntegration(thumbnailGeneratorFunction)
    );
  }
}
