#!/bin/bash
# Auto-deployment script for EC2
# This script pulls latest images from ECR and restarts containers

set -e

AWS_REGION="${AWS_REGION:-eu-west-3}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
ECR_REGISTRY="${ECR_REGISTRY:-${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com}"
ECR_REPO="${ECR_REPO:-auto-blog}"

echo "=== Auto-deploying latest images ==="

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Pull latest images
echo "Pulling latest backend image..."
docker pull $ECR_REGISTRY/$ECR_REPO:backend-latest

echo "Pulling latest frontend image..."
docker pull $ECR_REGISTRY/$ECR_REPO:frontend-latest

# Stop and remove old containers
echo "Stopping old containers..."
docker stop auto-blog-backend auto-blog-frontend || true
docker rm auto-blog-backend auto-blog-frontend || true

# Start new containers
echo "Starting backend container..."
docker run -d \
  --name auto-blog-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  -v /home/ubuntu/data:/app/data \
  $ECR_REGISTRY/$ECR_REPO:backend-latest

echo "Starting frontend container..."
docker run -d \
  --name auto-blog-frontend \
  --restart unless-stopped \
  -p 80:80 \
  $ECR_REGISTRY/$ECR_REPO:frontend-latest

echo "=== Deployment complete ==="
docker ps
