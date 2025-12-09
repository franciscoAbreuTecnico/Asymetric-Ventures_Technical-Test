#!/usr/bin/env bash

# This script pulls the latest backend and frontend images from your ECR
# repository and runs them on an EC2 instance.  It assumes Docker is
# installed and that you have already logged in to ECR (see init-ec2.sh).

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <ECR_REPOSITORY_URI> [<IMAGE_TAG>]"
  echo "Example: $0 123456789012.dkr.ecr.eu-west-1.amazonaws.com/my-blog latest"
  exit 1
fi

REPO_URI=$1
TAG=${2:-latest}

echo "Deploying images from $REPO_URI with tag $TAG"

# Create a dedicated network for the blog containers if it doesn’t already exist
if ! docker network ls --format '{{.Name}}' | grep -q '^blog-net$'; then
  docker network create blog-net
fi

# Pull the latest images
docker pull "$REPO_URI/backend:$TAG"
docker pull "$REPO_URI/frontend:$TAG"

# Stop and remove any existing containers
docker rm -f auto-blog-backend || true
docker rm -f auto-blog-frontend || true

# Run the backend
docker run -d \
  --name auto-blog-backend \
  --network blog-net \
  -p 3001:3001 \
  "$REPO_URI/backend:$TAG"

# Run the frontend.  Map port 80 on the host to 5173 in the container so
# that the website is served on the default HTTP port.  Set
# VITE_BACKEND_URL so the frontend can reach the backend via the Docker network.
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "localhost")
docker run -d \
  --name auto-blog-frontend \
  --network blog-net \
  -e VITE_BACKEND_URL=http://auto-blog-backend:3001 \
  -p 80:5173 \
  "$REPO_URI/frontend:$TAG"

echo "Deployment complete.  Frontend running on port 80 and backend on port 3001."