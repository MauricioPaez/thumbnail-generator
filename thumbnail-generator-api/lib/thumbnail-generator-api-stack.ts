import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export class ThumbnailGeneratorApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const frontendBucket = new Bucket(this, "ThumbnailGeneratorApp", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const bucketDeployment = new BucketDeployment(
      this,
      "DeployThumbnailGeneratorApp",
      {
        sources: [Source.asset(`../thumbnail-generator-app/build`)],
        destinationBucket: frontendBucket,
      }
    );
    bucketDeployment.node.addDependency(frontendBucket);

    const thumbnailGeneratorFunction = new NodejsFunction(
      this,
      "ThumbnailGenerator",
      {
        handler: "lambdaHandler",
        entry: "./src/app.ts"
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

    const uploadsBucket = new Bucket(this, "ThumbnailGeneratorUploadsBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    uploadsBucket.grantReadWrite(thumbnailGeneratorFunction);
  }
}
