# Thumbnail Generator

The following is a simple web app that generates 3 thumbnails in different sizes of a selected image. You can find the app at:

http://thumbnailgeneratorapista-thumbnailgeneratorappbb3-1w8kmbmhb0qnp.s3-website-us-east-1.amazonaws.com/

The app's backend was build using AWS for:
- Hosting on S3
- Cloud computing using Lambda Functions written in Typescript
- API Gateway to expose functions on a REST API
- CDK to declare IaC and deploy the needed stack
- S3 storage to upload and retrieve images

The app's frontend was build using:
- React 18.1 with Typescript
- Tailwind CSS - For simple layout css
- MUI React - Material-like components for React

