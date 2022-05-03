import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  Cors,
  IResource,
  LambdaIntegration,
  LambdaRestApi,
} from "aws-cdk-lib/aws-apigateway";
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

    // Create Uploads Bucket
    let corsRule: CorsRule = {
      allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
      allowedOrigins: Cors.ALL_ORIGINS,
      allowedHeaders: ["*"],
    };

    const uploadsBucket = new Bucket(this, "ThumbnailGeneratorUploadsBucket", {
      bucketName: "thumbnail-generator-uploads-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [corsRule],
    });

    // Lambda function that generates a PutObject presigned URL
    const createPresignedUrlFunction = new NodejsFunction(
      this,
      "CreatePresignedUrlFunction",
      {
        handler: "lambdaHandler",
        entry: "./src/presigned-url.ts",
        environment: {
          UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
          REGION: this.region,
        },
      }
    );
    uploadsBucket.grantPut(createPresignedUrlFunction);

    // NodeJS lambda function that generates the thumbnails
    const thumbnailGeneratorFunction = new NodejsFunction(
      this,
      "ThumbnailGenerator",
      {
        handler: "lambdaHandler",
        entry: "./src/generate-thumbnails.ts",
        timeout: Duration.minutes(15),
        memorySize: 1024,
        bundling: {
          nodeModules: ["sharp"],
        },
        environment: {
          UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
          REGION: this.region,
        },
      }
    );
    uploadsBucket.grantPut(thumbnailGeneratorFunction);

    // Lambda REST API
    const thumbnailGeneratorRestApi = new LambdaRestApi(
      this,
      "thumbnailGeneratorRestApi",
      {
        restApiName: "Thumbnail Generator API",
        description: "REST API used to generate thumbnails",
        handler: thumbnailGeneratorFunction,
        proxy: false,
        defaultCorsPreflightOptions: {
          allowHeaders: [
            "Content-Type",
            "X-Amz-Date",
            "Authorization",
            "X-Api-Key",
          ],
          allowMethods: Cors.ALL_METHODS,
          allowCredentials: true,
          allowOrigins: Cors.ALL_ORIGINS,
        },
      }
    );

    // Adding resources to the API
    const generatorResource: IResource =
      thumbnailGeneratorRestApi.root.addResource("generate");
    const presignedUrlResource: IResource =
      thumbnailGeneratorRestApi.root.addResource("presignedUrl");

    // POST Method associated to the ThumbnailGeneratorFunction
    generatorResource.addMethod(
      HttpMethods.GET,
      new LambdaIntegration(thumbnailGeneratorFunction)
    );

    // GET Method associated to the CreatePresignedUrlFunction
    presignedUrlResource.addMethod(
      HttpMethods.GET,
      new LambdaIntegration(createPresignedUrlFunction)
    );
  }
}
