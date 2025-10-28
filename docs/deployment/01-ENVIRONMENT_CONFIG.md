# PWA Environment Configuration Guide

## 🌍 Overview

This guide covers environment-specific configuration for PWA features across development, staging, and production environments.

---

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Staging Configuration](#staging-configuration)
3. [Production Deployment](#production-deployment)
4. [Docker Configuration](#docker-configuration)
5. [Nginx Headers](#nginx-headers)
6. [CDN Setup](#cdn-setup)
7. [Environment Variables](#environment-variables)
8. [Verification by Environment](#verification-by-environment)

---

## Development Setup

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

### Key Points

- ✅ Service Worker **disabled** by default (prevents caching issues)
- ✅ Hot reload works properly
- ✅ Cache is not persistent
- ✅ Perfect for development

### Testing PWA in Development

**Option 1: Production Build with Http-Server**
```bash
npm run build:shell
npx http-server dist/shell -c-1
# Access at http://localhost:8080
# Service Worker will be registered
```

**Option 2: Angular CLI with Service Worker**
```bash
ng build shell --configuration production --service-worker
npx http-server dist/shell -c-1
```

**Option 3: Docker Compose**
```bash
docker-compose up
# Access at http://localhost
```

### DevTools Verification

```
DevTools → Application tab
├── Service Workers
│   └── Should be EMPTY (not registered in dev)
├── Cache Storage
│   └── May be empty
└── Network
    └── Check request/response headers
```

---

## Staging Configuration

### Environment Setup

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

✅ Test PWA in production-like environment  
✅ Verify caching strategies work correctly  
✅ Test update deployment process  
✅ Monitor performance before production  

### Build for Staging

```bash
# Build with staging configuration
ng build shell --configuration staging

# Verify PWA files generated
ls dist/shell/ | grep -E "ngsw|manifest"

# Expected output:
# ngsw-worker.js
# ngsw.json
# manifest.webmanifest
```

### Deploy to Staging

```bash
# Copy dist to staging server
scp -r dist/shell/* user@staging-server:/var/www/html/

# Or use Docker
docker build -f Dockerfile.shell -t mfe-shell:staging .
docker push user@staging-registry/mfe-shell:staging
```

### Staging Testing Checklist

- [ ] Service Worker registers correctly
- [ ] Update notifications appear
- [ ] Offline mode works
- [ ] Installation prompts show
- [ ] Cache sizes within limits
- [ ] Performance metrics acceptable

---

## Production Deployment

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

### Build for Production

```bash
# Build with production configuration
npm run build:shell

# or
ng build shell --configuration production

# Verify outputs
ls -la dist/shell/ | grep -E "ngsw|manifest"
```

### Deployment Steps

1. **Build the application**
   ```bash
   npm run build:shell
   ```

2. **Verify PWA files**
   ```bash
   ls dist/shell/ngsw*.js dist/shell/manifest.webmanifest
   ```

3. **Upload to server**
   ```bash
   scp -r dist/shell/* user@prod-server:/var/www/html/
   ```

4. **Verify HTTPS**
   ```bash
   curl -I https://your-domain.com
   # Check: HTTP/2 200
   # Check: Strict-Transport-Security
   ```

5. **Test PWA functionality**
   - Open DevTools → Application → Service Workers
   - Verify `ngsw-worker.js` registered
   - Test offline mode
   - Check for update notification

### Production Checklist

- [ ] HTTPS enabled with valid certificate
- [ ] Service Worker accessible
- [ ] ngsw.json returns 200 status
- [ ] manifest.webmanifest accessible
- [ ] Cache headers configured correctly
- [ ] Icons accessible via manifest URLs
- [ ] Monitoring and alerting configured
- [ ] Rollback plan established

---

## Docker Configuration

### Development Docker

```dockerfile
# Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 4200
CMD ["npm", "start"]
```

Usage:
```bash
docker build -f Dockerfile.dev -t mfe-shell-dev .
docker run -p 4200:4200 mfe-shell-dev
```

### Production Docker

```dockerfile
# Dockerfile.shell (multi-stage)
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build:shell

FROM nginx:alpine
COPY --from=builder /app/dist/shell /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  shell:
    image: mfe-shell:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
      - PWA_ENABLED=true
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/index.html"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Nginx Headers Configuration

### Service Worker Headers

```nginx
# /etc/nginx/nginx.conf

# Service Worker script
location = /ngsw-worker.js {
    add_header Cache-Control "public, max-age=86400";
    add_header Service-Worker-Allowed "/";
    add_header Content-Type "application/javascript";
}

# Service Worker manifest
location = /ngsw.json {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Content-Type "application/json";
}

# Web App Manifest
location = /manifest.webmanifest {
    add_header Cache-Control "public, max-age=86400";
    add_header Content-Type "application/manifest+json";
}
```

### Asset Caching Headers

```nginx
# Hashed assets (can be cached long-term)
location ~* "\.(?:js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2)$" {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML files (validate every request)
location ~* "\.html?$" {
    add_header Cache-Control "public, max-age=0, must-revalidate";
}

# Default (SPA routing)
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "public, max-age=0, must-revalidate";
}
```

### Security Headers

```nginx
# Add these headers for security
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### HTTPS Configuration

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of configuration
}
```

---

## CDN Setup

### CloudFlare Configuration

| Path | Cache Level | TTL |
|------|-------------|-----|
| `/ngsw-worker.js` | Bypass | No Cache |
| `/ngsw.json` | Bypass | No Cache |
| `/manifest.webmanifest` | Cache All | 1 day |
| `/*.js, /*.css` | Cache All | 1 day |
| `/assets/**` | Cache All | 30 days |
| `/` | Bypass | No Cache |

**Setup Steps:**
1. Go to CloudFlare Dashboard
2. Create Cache Rules for each pattern
3. Set appropriate TTL values
4. Enable "Browser Cache Expiration"
5. Test with DevTools Network tab

### AWS CloudFront

```json
{
  "CacheBehaviors": [
    {
      "PathPattern": "ngsw-worker.js",
      "ViewerProtocolPolicy": "https-only",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    },
    {
      "PathPattern": "ngsw.json",
      "ViewerProtocolPolicy": "https-only",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "DefaultTTL": 0,
      "MaxTTL": 0
    },
    {
      "PathPattern": "manifest.webmanifest",
      "ViewerProtocolPolicy": "https-only",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    }
  ]
}
```

---

## Environment Variables

### Create `.env` File

```bash
# .env - Environment Configuration

# PWA Settings
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

# App Settings
VITE_APP_NAME=Angular MFE
VITE_APP_VERSION=1.0.0
```

### Use in Code

```typescript
// Access environment variables
const apiUrl = process.env['VITE_API_URL'];
const pwaEnabled = process.env['VITE_PWA_ENABLED'] === 'true';
```

---

## Verification by Environment

### Development Verification

```bash
# 1. Build development
npm run build:shell:dev

# 2. Check for service worker (should NOT exist)
ls dist/shell/ | grep ngsw
# Should return: (nothing)

# 3. Start development server
npm start

# 4. Open DevTools
# DevTools → Application → Service Workers
# Should show: (empty)
```

### Staging Verification

```bash
# 1. Build staging
npm run build:shell:staging

# 2. Check for PWA files (SHOULD exist)
ls dist/shell/ | grep -E "ngsw|manifest"
# Should show: ngsw-worker.js, ngsw.json, manifest.webmanifest

# 3. Serve with http-server
npx http-server dist/shell -c-1

# 4. Open DevTools
# DevTools → Application → Service Workers
# Should show: ngsw-worker.js registered

# 5. Test offline mode
# DevTools → Network → Offline
# Reload page - should still work
```

### Production Verification

```bash
# 1. Build production
npm run build:shell

# 2. Deploy to production server

# 3. Test with curl
curl -I https://your-domain.com/ngsw-worker.js
# Should show: Cache-Control: public, max-age=86400

curl -I https://your-domain.com/ngsw.json
# Should show: Cache-Control: no-cache

# 4. Open DevTools on production
# DevTools → Application → Service Workers
# Should show: ngsw-worker.js registered

# 5. Verify manifest
curl https://your-domain.com/manifest.webmanifest
# Should return valid JSON
```

---

## Build Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build:shell:dev": "ng build shell --configuration development",
    "build:shell:staging": "ng build shell --configuration staging",
    "build:shell:prod": "ng build shell --configuration production",
    "serve:pwa:dev": "ng build shell --configuration development --service-worker && npx http-server dist/shell -c-1",
    "serve:pwa:prod": "ng build shell --configuration production && npx http-server dist/shell -c-1"
  }
}
```

---

## Troubleshooting

### Problem: Service Worker Not Registering

**Cause:** HTTPS not enabled or development mode  
**Solution:**
1. Verify HTTPS is working
2. Check browser console for errors
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)

### Problem: Updates Not Deploying

**Cause:** CDN caching ngsw.json  
**Solution:**
1. Verify ngsw.json cache headers
2. Purge CDN cache
3. Check ngsw.json contains new hash

### Problem: Old Version Still Cached

**Cause:** Browser cache or CDN  
**Solution:**
1. User: Hard refresh (Ctrl+Shift+R)
2. Server: Purge CDN cache
3. Service Worker: Clears automatically with versioning

---

## Next Steps

1. **Immediate:** Configure HTTPS for production
2. **Short-term:** Set up nginx headers
3. **Medium-term:** Configure CDN caching
4. **Ongoing:** Monitor PWA metrics

---

**Navigation**:
- [← Back to Reference](../reference/02-COMPLETE_SUMMARY.md)
- [Deployment Guide →](./02-DEPLOYMENT_GUIDE.md)
