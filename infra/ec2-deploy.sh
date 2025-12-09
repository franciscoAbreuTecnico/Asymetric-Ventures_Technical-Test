#!/bin/bash
set -e

echo "=== Auto-Blog EC2 Deployment Script ==="
echo "Installing Docker..."

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configuration - Set these variables
AWS_REGION="${AWS_REGION:-eu-west-3}"
ECR_REGISTRY="${ECR_REGISTRY:-<account-id>.dkr.ecr.eu-west-3.amazonaws.com}"
ECR_REPO="${ECR_REPO:-auto-blog}"

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin $ECR_REGISTRY

echo "Pulling Docker images..."
sudo docker pull $ECR_REGISTRY/$ECR_REPO:backend-latest
sudo docker pull $ECR_REGISTRY/$ECR_REPO:frontend-latest

echo "Creating Docker network..."
sudo docker network create auto-blog-network 2>/dev/null || true

echo "Stopping existing containers..."
sudo docker stop auto-blog-backend auto-blog-frontend 2>/dev/null || true
sudo docker rm auto-blog-backend auto-blog-frontend 2>/dev/null || true

echo "Starting backend container..."
sudo docker run -d \
  --name auto-blog-backend \
  --network auto-blog-network \
  -p 3001:3001 \
  -e AI_PROVIDER=local \
  -e PORT=3001 \
  -v /data:/data \
  --restart unless-stopped \
  $ECR_REGISTRY/$ECR_REPO:backend-latest

echo "Starting frontend container..."
sudo docker run -d \
  --name auto-blog-frontend \
  --network auto-blog-network \
  -p 80:5173 \
  --restart unless-stopped \
  $ECR_REGISTRY/$ECR_REPO:frontend-latest

echo ""
echo "=== Deployment Complete! ==="
echo "Check your EC2 public IP to access the application"
echo "Frontend: http://<your-ec2-ip>"
echo "Backend API: http://<your-ec2-ip>:3001/articles"
echo ""
echo "Check container status:"
echo "sudo docker ps"
echo ""
echo "View logs:"
echo "sudo docker logs auto-blog-backend"
echo "sudo docker logs auto-blog-frontend"
