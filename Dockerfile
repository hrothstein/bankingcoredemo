# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache sqlite python3 make g++ curl

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build frontend (outputs to backend/public)
# For now, create a simple placeholder since React components aren't built yet
RUN mkdir -p backend/public && \
    echo '<!DOCTYPE html><html><head><title>Core Banking Demo</title></head><body><h1>Core Banking System</h1><p>API available at port 3001</p><p>Documentation at <a href="http://localhost:3001/docs">http://localhost:3001/docs</a></p></body></html>' > backend/public/index.html

# Initialize database and seed demo data
RUN npm run init:db
RUN npm run seed:data

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S banking -u 1001
RUN chown -R banking:nodejs /app
USER banking

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["npm", "start"]