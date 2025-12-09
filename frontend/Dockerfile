# Multi‑stage build for the React frontend

### Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app

# Accept build argument for backend URL
ARG VITE_BACKEND_URL=http://localhost:3001
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Install dependencies and build the frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

### Stage 2: Serve the built files
FROM node:18-alpine
WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy the build output from the previous stage
COPY --from=build /app/dist ./dist

# Expose port 5173 for the HTTP server
EXPOSE 5173

# When the container starts, run the static file server.  The -s flag tells
# serve to redirect all requests (for client‑side routing) and -l sets the
# listening port.  The host must be 0.0.0.0 to be reachable from outside
CMD ["serve", "-s", "dist", "-l", "5173"]