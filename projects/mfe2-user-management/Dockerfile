# Multi-stage build for MFE2 User Management
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files from root
COPY package*.json ./
COPY angular.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY projects/mfe2-user-management ./projects/mfe2-user-management
COPY projects/shared ./projects/shared

# Build the MFE2 application
RUN npm run build:mfe2

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist/mfe2-user-management/browser /usr/share/nginx/html

# Copy nginx configuration
COPY projects/mfe2-user-management/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
