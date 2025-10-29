# Multi-stage build for MFE3 Auth
FROM node:20-alpine AS builder

WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy package files from root
COPY package*.json ./
COPY angular.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY projects/mfe3-auth ./projects/mfe3-auth
COPY projects/shared ./projects/shared

# Build the MFE3 application
RUN npm run build:mfe3

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist/mfe3-auth/browser /usr/share/nginx/html

# Update nginx config
RUN echo 'add_header X-Frame-Options "SAMEORIGIN" always;' >> /etc/nginx/conf.d/default.conf && \
    echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '  listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '  server_name _;' >> /etc/nginx/conf.d/default.conf && \
    echo '  root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '    try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '  }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY projects/mfe3-auth/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
