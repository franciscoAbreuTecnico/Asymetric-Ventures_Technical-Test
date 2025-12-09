#!/usr/bin/env bash

# This script is intended to run on a fresh Amazon Linux 2 EC2 instance.
# It installs Docker, adds the ec2-user to the docker group, starts the
# service and logs into your ECR registry using the AWS CLI.  After
# running this script you should be able to execute the deploy.sh script
# to pull and run your blog containers.

set -euo pipefail

if [ -z "${AWS_REGION:-}" ] || [ -z "${ECR_REGISTRY:-}" ]; then
  echo "Environment variables AWS_REGION and ECR_REGISTRY must be set"
  exit 1
fi

echo "Updating system packages..."
sudo yum update -y

echo "Installing Docker..."
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -aG docker ec2-user

echo "Installing AWS CLI..."
if ! command -v aws >/dev/null 2>&1; then
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip awscliv2.zip
  sudo ./aws/install
fi

echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" | sudo docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "Docker and AWS CLI setup complete.  Please log out and back in or run 'newgrp docker' for group changes to take effect."