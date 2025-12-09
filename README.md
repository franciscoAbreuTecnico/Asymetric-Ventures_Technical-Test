# Auto-Generated Blog - Technical Challenge

This repository contains a complete solution for the Asymetric Ventures technical challenge: an auto-generated blog built with React, Node.js, and SQLite, deployed on AWS using Docker, EC2, and ECR.

## Live Deployment

- Application: http://[[deployed-ec2-ip]](http://13.38.249.91/)
- Backend API: http://[[deployed-ec2-ip]](http://13.38.249.91/):3001/articles

## Overview

The application generates blog articles automatically using a local AI model (distilgpt2). New articles are created daily via a cron job. The system consists of:

- Backend: Express API with SQLite database, AI article generation, and rate limiting
- Frontend: React SPA displaying article list and detail views  
- Infrastructure: Docker containers deployed on AWS EC2, images stored in ECR

## Repository Structure

```
.
├── backend/              Express API with article generation
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/articles.js
│   │   ├── services/
│   │   │   ├── aiClient.js       AI text generation
│   │   │   └── articleJob.js     Daily cron job
│   │   └── models/articleModel.js
│   ├── Dockerfile
│   └── package.json
│
├── frontend/             React application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── api/client.js
│   ├── Dockerfile
│   └── package.json
│
├── infra/                Deployment configuration
│   ├── docker-compose.yml
│   ├── buildspec.yml
│   └── scripts/
│       ├── deploy.sh
│       └── init-ec2.sh
│
└── README.md
```

## Challenge Requirements Met

### Application Requirements
- React frontend displaying article list and detail views
- Node.js backend with REST API endpoints
- SQLite database for persistent storage
- AI-generated article content
- Daily automatic article generation
- Pre-seeded with 3+ articles

### Infrastructure Requirements
- Dockerized frontend and backend with separate Dockerfiles
- Docker images stored in AWS ECR
- Application deployed on AWS EC2 (not ECS)
- Security measures: rate limiting, optional API authentication

## Technical Decisions

### AI Text Generation
Choice: Local distilgpt2 model via @xenova/transformers

Reasoning:
- Zero cost (no API fees)
- No rate limits or API dependencies
- Complete control over generation
- Runs on free-tier EC2 instance

Trade-off: Required instance upgrade from t3.micro (1GB) to t3.small (2GB) to accommodate model memory requirements.

### Database
Choice: SQLite with better-sqlite3

Reasoning:
- Simple deployment, no separate database server
- File-based storage with Docker volume persistence
- Synchronous API suitable for single-instance deployment
- Zero configuration required

### Deployment Strategy
Choice: Manual deployment with ECR + EC2

Reasoning:
- Direct control over deployment process
- Simpler debugging and iteration
- CodeBuild infrastructure available (buildspec.yml) but not used for this demo
- Can add full CI/CD automation later if needed

Process:
1. Build Docker images locally
2. Push to ECR
3. SSH to EC2 and pull images
4. Run containers with configured environment

### Security
- Rate limiting: 5 requests/hour per IP on generation endpoint
- Optional API key authentication (backward compatible)
- CloudWatch billing alarm configured at $2 threshold
- Read-only public access for article viewing endpoints

## Running Locally

Prerequisites: Docker and Docker Compose installed

1. Clone the repository:
```bash
git clone <repository-url>
cd asymetric-ventures-technical-test
```

2. Start with Docker Compose:
```bash
cd infra
docker compose up --build
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/articles

The backend will automatically create 3 articles on first startup. New articles are generated daily at 8 AM.

## AWS Deployment

### Example Deployment Configuration
- Region: eu-west-3 (Paris)
- Instance Type: t3.small (2GB RAM, free tier eligible)
- ECR Registry: <account-id>.dkr.ecr.eu-west-3.amazonaws.com/auto-blog
- Security Group: Allow ports 22 (SSH), 80 (HTTP), 3001 (API)
- Monthly Cost: $0.00 (within free tier limits)

### Deployment Steps

1. Create ECR repository:
```bash
aws ecr create-repository --repository-name auto-blog --region eu-west-3
```

2. Build and push Docker images:
```bash
aws ecr get-login-password --region eu-west-3 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-west-3.amazonaws.com

docker build -t infra-backend backend
docker build --build-arg VITE_BACKEND_URL=http://<EC2-IP>:3001 -t infra-frontend frontend

docker tag infra-backend <account-id>.dkr.ecr.eu-west-3.amazonaws.com/auto-blog:backend-latest
docker tag infra-frontend <account-id>.dkr.ecr.eu-west-3.amazonaws.com/auto-blog:frontend-latest

docker push <account-id>.dkr.ecr.eu-west-3.amazonaws.com/auto-blog:backend-latest
docker push <account-id>.dkr.ecr.eu-west-3.amazonaws.com/auto-blog:frontend-latest
```

3. Launch EC2 instance:
- Amazon Linux 2023
- Instance type: t3.small (2GB RAM required for local AI model)
- Security group: Allow ports 22 (SSH), 80 (HTTP), 3001 (API)
- Use infra/scripts/init-ec2.sh to install Docker

4. Deploy containers on EC2:
```bash
docker network create auto-blog-network

docker run -d --name auto-blog-backend \
  --network auto-blog-network \
  -p 3001:3001 \
  -e AI_PROVIDER=local \
  -e PORT=3001 \
  -v /data:/data \
  --restart unless-stopped \
  <registry>/auto-blog:backend-latest

docker run -d --name auto-blog-frontend \
  --network auto-blog-network \
  -p 80:5173 \
  --restart unless-stopped \
  <registry>/auto-blog:frontend-latest
```

See infra/scripts/deploy.sh for the complete deployment script.

## API Endpoints

- `GET /articles` - List all articles
- `GET /articles/:id` - Get single article by ID  
- `POST /articles/generate` - Manually generate new article (rate limited to 5/hour per IP)

## Environment Variables

### Backend
- `PORT` - Server port (default: 3001)
- `AI_PROVIDER` - AI provider: local, faker, openrouter, huggingface, ollama (default: faker)
- `API_KEY` - Optional API key to protect generation endpoint

### Frontend  
- `VITE_BACKEND_URL` - Backend API URL (must be set at Docker build time)

## Improvements for Production

With more time, the following improvements would enhance the system:

1. CI/CD Pipeline: Automate builds and deployments using CodeBuild with GitHub webhooks
2. HTTPS: Add SSL certificate via AWS Certificate Manager with Application Load Balancer
3. Elastic IP: Prevent IP changes on instance restarts
4. Monitoring: CloudWatch dashboards for resource usage, errors, and request metrics
5. Database Backups: Automated S3 backups of SQLite database
6. Better AI Model: Upgrade to larger model for higher quality content (requires GPU instance)
7. Testing: Unit and integration tests for backend and frontend
8. Caching: Add Redis for API response caching
9. CDN: CloudFront distribution for frontend assets

## Cost Analysis

Current monthly cost: $0.00

- EC2 t3.small: Free tier eligible (750 hours/month for first 12 months)
- ECR storage: Free tier eligible (500 MB)
- Data transfer: Free tier eligible (100 GB/month)
- Local AI model: No external API costs

CloudWatch billing alarm configured at $2 threshold for cost monitoring.

## Testing

Verify the deployment:

```bash
# Test backend API
curl http://<your-ec2-ip>:3001/articles

# Test article generation  
curl -X POST http://<your-ec2-ip>:3001/articles/generate

# Test rate limiting (6th request should fail)
for i in {1..6}; do curl -X POST http://<your-ec2-ip>:3001/articles/generate; done
```

Access frontend in browser: http://<your-ec2-ip>

## License

This project was created as a technical challenge submission for Asymetric Ventures.
