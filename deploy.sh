#!/bin/bash

# Smart Farming System - AWS Deployment Script
echo "🌱 Smart Farming System - AWS Deployment"
echo "========================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
REPO_NAME="smart-farming-system"

echo "📋 Deployment Configuration:"
echo "   AWS Account ID: $AWS_ACCOUNT_ID"
echo "   AWS Region: $AWS_REGION"
echo "   Repository: $REPO_NAME"
echo ""

# Create ECR repository if it doesn't exist
echo "🔧 Creating ECR repository..."
aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo "🏗️  Building Docker image..."
docker build -t $REPO_NAME:latest .

# Tag image
echo "🏷️  Tagging image..."
docker tag $REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest

# Push to ECR
echo "📤 Pushing to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Go to AWS ECS Console"
echo "   2. Create a new cluster (if not exists)"
echo "   3. Create a task definition using the pushed image"
echo "   4. Create a service to run the task"
echo ""
echo "📝 Image URI: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest"
echo ""
echo "🌐 Your app will be available at the ECS service endpoint!"