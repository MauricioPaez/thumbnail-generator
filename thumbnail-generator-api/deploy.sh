# Build front end app before deploying
cd ../thumbnail-generator-app
echo "================> Building React App..."
npm run build

# Build NodeJs lambda functions before bundling
cd ../thumbnail-generator-api
echo "================> Build NodeJs functions..."
npm run build

# Deploy using AWS CDK CLI
echo "================> Deploying stack..."
cdk deploy --profile MPPersonal