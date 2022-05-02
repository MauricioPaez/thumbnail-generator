import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket, CorsRule, HttpMethods } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

export class ThumbnailGeneratorApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Public bucket to expose web app
    const frontendBucket = new Bucket(this, "ThumbnailGeneratorApp", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Deployment bucket that contains build files of the web app
    const bucketDeployment = new BucketDeployment(
      this,
      "DeployThumbnailGeneratorApp",
      {
        sources: [Source.asset(`../thumbnail-generator-app/build`)],
        destinationBucket: frontendBucket,
      }
    );
    bucketDeployment.node.addDependency(frontendBucket);

    // Lambda function that generates a PutObject presigned URL
    const createCredentialsFunction = new NodejsFunction(
      this,
      "CreateCredentialsFunction",
      {
        handler: "lambdaHandler",
        entry: "./src/credentials.ts",
      }
    );

    // NodeJS lambda function that generates the thumbnails
    const thumbnailGeneratorFunction = new NodejsFunction(
      this,
      "ThumbnailGenerator",
      {
        handler: "lambdaHandler",
        entry: "./src/app.ts",
        timeout: Duration.minutes(15),
        memorySize: 1024,
        bundling: {
          nodeModules: ["sharp"],
        },
      }
    );

    // Lambda REST API
    const thumbnailGeneratorRestApi = new LambdaRestApi(
      this,
      "thumbnailGeneratorRestApi",
      {
        restApiName: "Thumbnail Generator API",
        handler: thumbnailGeneratorFunction,
        proxy: false,
      }
    );

    // Adding resources to the API
    const generator = thumbnailGeneratorRestApi.root.addResource("generate");
    const credentials =
      thumbnailGeneratorRestApi.root.addResource("credentials");

    // POST Method associated to the ThumbnailGeneratorFunction
    generator.addMethod(
      "POST",
      new LambdaIntegration(thumbnailGeneratorFunction)
    );

    // GET Method associated to the CreateCredentialsFunction
    credentials.addMethod(
      "GET",
      new LambdaIntegration(createCredentialsFunction)
    );

    let corsRule: CorsRule = {
      allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
      allowedOrigins: ["*"],
    };

    const uploadsBucket = new Bucket(this, "ThumbnailGeneratorUploadsBucket", {
      bucketName: "thumbnail-generator-uploads-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [corsRule],
    });

    uploadsBucket.grantReadWrite(thumbnailGeneratorFunction);
    uploadsBucket.grantPut(createCredentialsFunction);
  }
}
