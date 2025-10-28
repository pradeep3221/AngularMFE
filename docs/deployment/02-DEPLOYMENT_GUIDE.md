# PWA Deployment Guide

## 🚀 Step-by-Step Production Deployment

This guide walks through deploying your PWA to production with confidence.

---

## 📋 Pre-Deployment Checklist

- [ ] HTTPS certificate obtained and verified
- [ ] Nginx/web server configured
- [ ] Docker images built and tested
- [ ] Staging environment tested thoroughly
- [ ] Rollback plan established
- [ ] Monitoring configured
- [ ] Team notified of deployment

---

## 🔧 Step 1: Pre-Build Verification

### Verify Build Configuration

```bash
# Check angular.json for service worker config
cat angular.json | grep -A 5 "serviceWorker"

# Output should show:
# "serviceWorker": "ngsw-config.json"
```

### Verify ngsw-config.json

```bash
# Check ngsw-config.json exists
ls -la ngsw-config.json

# Verify JSON syntax
cat ngsw-config.json | python -m json.tool > /dev/null && echo "Valid JSON"
```

### Verify manifest.webmanifest

```bash
# Check manifest exists
ls -la projects/shell/public/manifest.webmanifest

# Verify icons are accessible
cat projects/shell/public/manifest.webmanifest | grep "icons"
```

---

## 🔨 Step 2: Build Process

### Clean Build

```bash
# Clean previous build artifacts
rm -rf dist/

# Ensure dependencies are installed
npm install

# Verify build scripts
npm run --list | grep build
```

### Production Build

```bash
# Build with production configuration
npm run build:shell

# Expected output:
# ✔ Compilation successful
# ✔ Service worker generated
```

### Verify Build Artifacts

```bash
# Check all required PWA files exist
ls -la dist/shell/ | grep -E "ngsw|manifest|index.html"

# Verify service worker
test -f dist/shell/ngsw-worker.js && echo "✓ ngsw-worker.js exists"
test -f dist/shell/ngsw.json && echo "✓ ngsw.json exists"
test -f dist/shell/manifest.webmanifest && echo "✓ manifest.webmanifest exists"

# Check build size
du -sh dist/shell/
```

### Verify Content Hash

```bash
# Inspect ngsw.json for content hashing
cat dist/shell/ngsw.json | head -20

# Should show structure like:
# {
#   "configVersion": 1,
#   "timestamp": ...,
#   "index": "/index.html?ngsw-cache=...",
#   "assetGroups": [ ... ]
# }
```

---

## 📦 Step 3: Package for Deployment

### Create Deployment Package

```bash
# Create archive
tar -czf mfe-shell-prod.tar.gz dist/shell/

# Or ZIP for Windows
zip -r mfe-shell-prod.zip dist/shell/

# Verify package
ls -lh mfe-shell-prod.tar.gz
```

### Generate Checksums

```bash
# For verification
sha256sum dist/shell/ngsw-worker.js > checksums.txt
sha256sum dist/shell/ngsw.json >> checksums.txt
sha256sum dist/shell/manifest.webmanifest >> checksums.txt

# Store for verification
cat checksums.txt
```

---

## 🔐 Step 4: HTTPS & Security Setup

### SSL/TLS Certificate

```bash
# Verify certificate validity
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout | grep -A 2 "Not Before\|Not After"

# Should show certificate expiration date

# For Let's Encrypt (auto-renewal)
certbot renew --dry-run
```

### Security Headers Verification

```bash
# Test headers with curl (after deployment)
curl -I https://your-domain.com/ngsw-worker.js

# Should include:
# HTTP/2 200
# Cache-Control: public, max-age=86400
# Service-Worker-Allowed: /
```

---

## 📥 Step 5: Upload to Server

### Option A: Direct SCP Upload

```bash
# Copy dist folder to web server
scp -r dist/shell/* user@prod-server:/var/www/html/

# Verify transfer
ssh user@prod-server "ls -la /var/www/html/ | head -20"
```

### Option B: Docker Push

```bash
# Build Docker image
docker build -f Dockerfile.shell -t mfe-shell:1.0.0 .

# Tag for registry
docker tag mfe-shell:1.0.0 registry.example.com/mfe-shell:1.0.0

# Push to registry
docker push registry.example.com/mfe-shell:1.0.0

# Pull on production server
docker pull registry.example.com/mfe-shell:1.0.0

# Run container
docker run -d -p 80:80 -p 443:443 registry.example.com/mfe-shell:1.0.0
```

### Option C: Git Deploy

```bash
# Push code to production branch
git push origin main

# On production server
cd /var/www/app
git pull origin main
npm run build:shell
```

---

## ✅ Step 6: Post-Deployment Verification

### Verify Files Accessible

```bash
# Test main file
curl -s https://your-domain.com/index.html | head -10

# Test service worker
curl -I https://your-domain.com/ngsw-worker.js

# Test manifest
curl -s https://your-domain.com/manifest.webmanifest | head -10

# Test an asset
curl -I https://your-domain.com/assets/icon-192.png
```

### Verify Service Worker

```bash
# Check HTTP status
curl -w "%{http_code}\n" -o /dev/null https://your-domain.com/ngsw-worker.js
# Should show: 200

# Verify cache headers
curl -I https://your-domain.com/ngsw-worker.js | grep "Cache-Control"
# Should show: Cache-Control: public, max-age=86400
```

### Verify Manifest

```bash
# Test manifest accessibility
curl -I https://your-domain.com/manifest.webmanifest

# Verify manifest content
curl https://your-domain.com/manifest.webmanifest | python -m json.tool

# Check icons are configured
curl https://your-domain.com/manifest.webmanifest | grep -A 2 '"icons"'
```

### Browser Testing

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Check Service Workers** section
   - Should show `ngsw-worker.js` in scope `/`
   - Status should be "activated and running"

4. **Check Cache Storage**
   - Should see caches like `ngsw:assets:app:cache`
   - Should show cached files

5. **Test offline mode**
   - DevTools → Network → Offline
   - Reload page
   - Page should load from cache

---

## 🔄 Step 7: Update Verification

### Trigger Update Check

1. **From browser console:**
   ```javascript
   // Check for updates
   navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' });
   ```

2. **Verify update notification appears**
   - Should show banner at top
   - Should have "Update Now" button

3. **Click "Update Now"**
   - App should refresh
   - New version should load

### Monitor Update Events

```bash
# Check service worker logs
# DevTools → Application → Service Workers → ngsw-worker.js
# Look for console logs

# Or check in browser console
window.addEventListener('message', event => {
  console.log('Service Worker message:', event.data);
});
```

---

## 📊 Step 8: Performance Monitoring

### Set Up Monitoring

```javascript
// Monitor PWA metrics
const perfObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance Entry:', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime
    });
    
    // Send to analytics
    gtag('event', 'performance', {
      metric_name: entry.name,
      value: entry.duration
    });
  }
});

perfObserver.observe({ entryTypes: ['navigation', 'resource'] });
```

### Key Metrics to Monitor

| Metric | Target | Acceptable Range |
|--------|--------|------------------|
| First Contentful Paint (FCP) | <1.8s | <3s |
| Largest Contentful Paint (LCP) | <2.5s | <4s |
| First Input Delay (FID) | <100ms | <200ms |
| Cache Hit Rate | >70% | >60% |
| Service Worker Registration Time | <500ms | <1000ms |

### Analytics Events to Track

```typescript
// Track PWA events
gtag('event', 'pwa_update_available');
gtag('event', 'pwa_install_prompt');
gtag('event', 'pwa_app_installed');
gtag('event', 'pwa_offline_mode');
gtag('event', 'pwa_online_restored');
```

---

## 🔄 Step 9: Rollback Procedure

### If Issues Detected

```bash
# Option 1: Rollback code
git revert <commit-hash>
git push origin main

# Option 2: Restore previous build
tar -xzf mfe-shell-prod-backup.tar.gz -C dist/

# Option 3: Docker rollback
docker run -d -p 80:80 registry.example.com/mfe-shell:0.9.0
```

### Clear Caches If Necessary

```bash
# Via nginx
curl -X PURGE http://your-domain.com/*

# Via CloudFlare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {token}" \
  -d '{"files":["https://your-domain.com/*"]}'
```

---

## ✨ Step 10: Post-Deployment Validation

### Final Checklist

- [ ] Service Worker registered and running
- [ ] All PWA files accessible (200 status)
- [ ] Cache headers correct
- [ ] Icons loading properly
- [ ] Offline mode works
- [ ] Update detection working
- [ ] Installation prompt appears
- [ ] Performance metrics acceptable
- [ ] No console errors
- [ ] Users receiving notifications

### User Communication

**Post-deployment announcement:**

```
🎉 PWA Deployment Successful!

✨ New Features:
- Install our app on your device
- Work offline with cached content
- Faster loading times
- Automatic updates

📱 How to Install:
1. Look for the install banner
2. Click "Install App"
3. App will be added to your home screen

🚀 Enjoy!
```

---

## 📈 Monitoring Dashboard Setup

### CloudFlare Analytics

```
Dashboard → Analytics → Edge requests
- Monitor request volume
- Check cache hit ratio
- Track error rates
```

### Server-Side Monitoring

```bash
# Monitor nginx access logs
tail -f /var/log/nginx/access.log | grep "ngsw"

# Monitor service worker requests
tail -f /var/log/nginx/access.log | grep "\.js\|\.json"
```

### Application Monitoring

```typescript
// Send PWA metrics to monitoring service
function sendMetrics() {
  const metrics = {
    url: window.location.href,
    swRegistered: navigator.serviceWorker ? 'yes' : 'no',
    onlineStatus: navigator.onLine,
    timestamp: new Date().toISOString()
  };
  
  fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metrics) });
}

// Call periodically
setInterval(sendMetrics, 5 * 60 * 1000);
```

---

## 🆘 Troubleshooting During Deployment

### Service Worker Not Registering

```bash
# Check ngsw-worker.js is accessible
curl -I https://your-domain.com/ngsw-worker.js

# Check for CORS issues
curl -I https://your-domain.com/ngsw-worker.js | grep "Access-Control"

# Fix: Add CORS header in nginx
add_header Access-Control-Allow-Origin "*";
```

### Update Not Deploying

```bash
# Verify ngsw.json changed
curl https://your-domain.com/ngsw.json | md5sum

# Compare with previous version
# If same hash = old version still cached

# Solution: Ensure build hash changed
npm run build:shell --force
```

### Icons Not Loading

```bash
# Verify icon URLs in manifest
curl https://your-domain.com/manifest.webmanifest | grep "src"

# Test icon accessibility
curl -I https://your-domain.com/assets/icons/icon-192x192.png

# Should return 200, not 404
```

---

## 📚 Reference

- [Nginx Security Headers](https://securityheaders.com)
- [Google Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)
- [Let's Encrypt HTTPS Setup](https://letsencrypt.org)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## ✅ Deployment Complete!

Your PWA is now live in production. Monitor performance, track user adoption, and celebrate! 🎉

---

**Navigation**:
- [← Back to Environment Config](./01-ENVIRONMENT_CONFIG.md)
- [Verification Guide →](../verification/01-CHECKLIST.md)
