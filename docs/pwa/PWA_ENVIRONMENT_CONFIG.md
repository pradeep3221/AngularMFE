# PWA Environment Configuration

This document provides environment-specific configuration for PWA features across different environments.

## Development Environment

### Configuration

```typescript
// projects/shell/src/environments/environment.ts
export const environment = {
  production: false,
  pwa: {
    enabled: false,  // Disabled in dev to allow hot reloading
    checkUpdateInterval: 60000  // Check every minute
  }
};
```

### Service Worker

- Service Worker does not run in development mode
- Updates are tested using production build
- Cache is not persistent across page reloads

### Testing PWA in Development

```bash
# Option 1: Use production build with http-server
npm run build:shell
npx http-server dist/shell -c-1

# Option 2: Use Angular CLI with service worker
ng build shell --configuration production --service-worker
npx http-server dist/shell -c-1

# Option 3: Use Docker
docker-compose up
# Access at http://localhost
```

## Production Environment

### Configuration

```typescript
// projects/shell/src/environments/environment.prod.ts
export const environment = {
  production: true,
  pwa: {
    enabled: true,
    checkUpdateInterval: 3600000  // Check every hour
  }
};
```

### Service Worker

- Service Worker enabled and cached
- Automatic update checks every hour
- Cache persists across sessions
- Offline support fully functional

### Build Configuration

```bash
# Build for production with PWA support
ng build shell --configuration production

# Verify PWA files
ls -la dist/shell/ | grep -E "ngsw|manifest"

# Output should include:
# - ngsw-worker.js
# - ngsw.json
# - manifest.webmanifest
```

### Deployment Checklist

- [ ] HTTPS enabled
- [ ] Valid SSL certificate
- [ ] Correct domain in manifest
- [ ] Icons accessible
- [ ] Service Worker cache buster working
- [ ] API endpoints configured for production

## Staging Environment

### Configuration

```typescript
// projects/shell/src/environments/environment.staging.ts
export const environment = {
  production: true,
  pwa: {
    enabled: true,
    checkUpdateInterval: 300000  // Check every 5 minutes (for testing)
  }
};
```

### Purpose

- Test PWA features in production-like environment
- Verify caching strategies
- Test update deployment process
- Monitor performance metrics

### Build and Deploy

```bash
# Build for staging
ng build shell --configuration staging

# Deploy to staging server
# Ensure firewall rules allow access
# Test with real browsers
```

## Docker Environment

### Configuration

Both development and production Docker environments support PWA.

#### Development Docker

```dockerfile
# projects/shell/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 4200
CMD ["npm", "start"]
```

Usage:
```bash
docker build -f Dockerfile.shell -t mfe-shell-dev .
docker run -p 4200:4200 mfe-shell-dev
```

#### Production Docker

```dockerfile
# Dockerfile.shell (existing)
# Uses multi-stage build with nginx
# Serves PWA-enabled application
```

Usage:
```bash
docker-compose build
docker-compose up
```

### Docker Compose Configuration

```yaml
# docker-compose.yml (relevant section)
services:
  shell:
    image: mfe-shell:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - PWA_ENABLED=true
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

## Nginx Configuration for Production

### Header Configuration

```nginx
# nginx.conf

# Service Worker specific headers
location = /ngsw-worker.js {
    add_header Cache-Control "public, max-age=1d";
    add_header Service-Worker-Allowed "/";
}

# Service Worker manifest
location = /ngsw.json {
    add_header Cache-Control "no-cache";
    add_header Content-Type "application/json";
}

# Web App Manifest
location = /manifest.webmanifest {
    add_header Cache-Control "public, max-age=1d";
    add_header Content-Type "application/manifest+json";
}

# Assets with hashing (can be cached long-term)
location ~* "\.(?:js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2)$" {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# Index and HTML (must validate)
location ~* "\.html?$" {
    add_header Cache-Control "public, max-age=0, must-revalidate";
}

# Default: prevent caching
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "public, max-age=0, must-revalidate";
}
```

## Environment Variables

Create `.env` file in project root:

```bash
# .env

# PWA Configuration
VITE_PWA_ENABLED=true
VITE_PWA_CHECK_INTERVAL=3600000

# Service Worker
VITE_SERVICE_WORKER_ENABLED=true

# API Endpoints
VITE_API_URL=https://api.example.com
VITE_MFE1_URL=https://mfe1.example.com
VITE_MFE2_URL=https://mfe2.example.com
VITE_MFE3_URL=https://mfe3.example.com

# Cache Configuration
VITE_CACHE_MAX_SIZE=100
VITE_CACHE_MAX_AGE=86400
```

## CDN Configuration

### CloudFlare Configuration

```
# Cache Rules
- Path: /ngsw-worker.js → Cache Level: Bypass
- Path: /ngsw.json → Cache Level: Bypass
- Path: /manifest.webmanifest → Cache Level: Cache All
- Path: /*.js, /*.css → Cache Level: Cache All (1 day TTL)
- Path: / → Cache Level: Bypass
```

### AWS CloudFront

```json
{
  "CacheBehaviors": [
    {
      "PathPattern": "ngsw-worker.js",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    {
      "PathPattern": "ngsw.json",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "DefaultTTL": 0
    },
    {
      "PathPattern": "manifest.webmanifest",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "DefaultTTL": 86400
    }
  ]
}
```

## Environment-Specific Build Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build:shell:dev": "ng build shell --configuration development",
    "build:shell:staging": "ng build shell --configuration staging",
    "build:shell:prod": "ng build shell --configuration production",
    "serve:pwa:dev": "ng build shell --configuration development --service-worker && npx http-server dist/shell -c-1",
    "serve:pwa:prod": "ng build shell --configuration production && npx http-server dist/shell -c-1 --https"
  }
}
```

## Verification by Environment

### Development

```bash
# Build development
npm run build:shell:dev

# Check for PWA files (should not include service worker in dev)
ls dist/shell/

# Start development server
npm start

# Check DevTools → Application → Service Workers
# Should show: No service workers registered
```

### Staging

```bash
# Build staging
npm run build:shell:staging

# Check for PWA files
ls dist/shell/ | grep -E "ngsw|manifest"

# Start with http-server
npx http-server dist/shell -c-1

# Check DevTools → Application → Service Workers
# Should show: ngsw-worker.js registered
```

### Production

```bash
# Build production
npm run build:shell:prod

# Check for PWA files
ls dist/shell/ | grep -E "ngsw|manifest"

# Deploy to production server
# Verify HTTPS is working
# Test in browser

# Check DevTools → Application → Service Workers
# Should show: ngsw-worker.js registered
# Check ngsw.json for cache hashing
```

## Performance Optimization by Environment

### Development
- Service Worker: Disabled
- Caching: None
- Update Check: Disabled
- Source Maps: Enabled

### Staging
- Service Worker: Enabled
- Caching: Minimal (for testing)
- Update Check: Every 5 minutes
- Source Maps: Enabled

### Production
- Service Worker: Enabled
- Caching: Aggressive (with versioning)
- Update Check: Every 1 hour
- Source Maps: Disabled
- Minification: Full
- Tree-shaking: Full

## Monitoring and Logging

### Enable PWA Logging

```typescript
// In app.ts
ngOnInit() {
  // Enable PWA debugging
  if (!environment.production) {
    console.log('[PWA] Debug mode enabled');
    const state = this.pwaService.getState();
    console.log('[PWA] Initial state:', state);
  }
}
```

### Production Logging

```typescript
// Collect PWA metrics
this.pwaService.getUpdateAvailable().subscribe(() => {
  // Send to analytics
  gtag('event', 'pwa_update_available');
});

this.pwaService.getInstallPromptAvailable().subscribe(() => {
  // Send to analytics
  gtag('event', 'pwa_install_prompt');
});
```

## Troubleshooting by Environment

### Development Issues

**Problem**: Service Worker doesn't register
- **Solution**: Service Worker disabled in dev by design. Build with production config to test.

**Problem**: Hot reload conflicts with caching
- **Solution**: Clear browser cache. Use DevTools → Network → Disable cache during development.

### Staging Issues

**Problem**: Updates not deploying
- **Solution**: Check ngsw.json hash changes. Clear CDN cache. Verify Service Worker version.

**Problem**: Old version still cached
- **Solution**: Service Worker cache has version hash. Deploy new version with different hash.

### Production Issues

**Problem**: Users stuck on old version
- **Solution**: Notify users to refresh. Update notification appears automatically.

**Problem**: HTTPS certificate error
- **Solution**: PWA requires valid HTTPS. Update certificate and restart server.

---

**Environment Setup Complete!** 

Your PWA is now configured for all environments. Follow environment-specific deployment procedures for optimal performance.
