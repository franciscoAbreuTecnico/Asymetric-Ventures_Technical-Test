# Build an image for the Node.js backend
# Using Debian slim instead of Alpine for better compatibility with ONNX Runtime
FROM node:18-slim

# Create app directory
WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /data && chmod 777 /data

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source (exclude node_modules to avoid binary conflicts)
COPY src ./src
COPY package*.json ./

# Expose the API port
EXPOSE 3001

# Set environment variable
ENV NODE_ENV=production

# Set the default command
CMD ["npm", "start"]

# Note:
# - Environment variables can be provided at runtime to configure the port
#   or AI API endpoints.  See README.md for details.