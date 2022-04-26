import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class ThumbnailGeneratorApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new lambda.Function(this, 'ThumbnailGenerator', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.lambdaHandler',
      code: lambda.Code.fromAsset('./thumbnail-generator-function'),
    });
  }
}
