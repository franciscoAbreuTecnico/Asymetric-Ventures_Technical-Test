# Frontend

React single-page application built with Vite. Displays article list and detail views, fetching data from the backend API.

## Setup

Development mode (requires Node 18+):

```bash
cd frontend
npm install
npm run dev
```

Application runs at http://localhost:5173

Production build:

```bash
npm run build
npm run preview
```

Docker mode:

```bash
docker build --build-arg VITE_BACKEND_URL=http://localhost:3001 -t auto-blog-frontend .
docker run -p 5173:5173 auto-blog-frontend
```

## Environment Variables

- `VITE_BACKEND_URL`: Backend API base URL (must be set at build time)

Important: Vite bakes environment variables into the static build. When deploying, set the production backend URL during build:

```bash
docker build --build-arg VITE_BACKEND_URL=http://<your-ec2-ip>:3001 -t frontend .
```

## Features

- Article list view with titles and creation dates
- Article detail view with full content
- Responsive layout
- Client-side routing with React Router

## File Structure

```
frontend/
├── src/
│   ├── App.jsx               Main component with routing
│   ├── main.jsx              Application entry point
│   ├── components/
│   │   ├── ArticleList.jsx   List view
│   │   └── ArticleDetail.jsx Detail view
│   └── api/
│       └── client.js         Axios API client
├── index.html
├── Dockerfile
└── package.json
```

## Deployment Notes

The production Dockerfile uses a two-stage build:
1. Build stage: Compiles React app with Vite
2. Runtime stage: Serves static files with serve package

Static files are served on port 5173 in production (mapped to port 80 on EC2).
