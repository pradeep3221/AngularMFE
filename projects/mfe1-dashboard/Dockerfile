# Multi-stage build for MFE1 Dashboard
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files from root
COPY package*.json ./
COPY angular.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY projects/mfe1-dashboard ./projects/mfe1-dashboard
COPY projects/shared ./projects/shared

# Build the MFE1 application
RUN npm run build:mfe1

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist/mfe1-dashboard/browser /usr/share/nginx/html

# Copy nginx configuration
COPY projects/mfe1-dashboard/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
