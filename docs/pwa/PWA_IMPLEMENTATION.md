# PWA (Progressive Web App) Implementation for Angular MFE

This document provides a comprehensive guide to the PWA functionality implemented in the Angular Microfrontend Architecture.

## Overview

Progressive Web App (PWA) support has been integrated into the Angular MFE shell application, providing users with:

- ✅ Offline functionality with cached content
- ✅ Installable app on desktop and mobile devices
- ✅ Automatic update notifications
- ✅ Service Worker for background sync and caching
- ✅ Web App Manifest for app metadata
- ✅ Online/offline status detection
- ✅ Background updates with user notification

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `projects/shared/src/lib/pwa.service.ts` | Core PWA service for update detection, offline handling, and install prompts |
| `projects/shell/src/app/components/update-available.component.ts` | Component displaying update and install banners |
| `projects/shell/src/app/components/offline-fallback.component.ts` | Fallback page for offline mode |
| `projects/shell/public/manifest.webmanifest` | Web App Manifest with app metadata and icons |
| `ngsw-config.json` | Service Worker configuration for caching strategies |

### Modified Files

| File | Changes |
|------|---------|
| `projects/shared/src/public-api.ts` | Exported PwaService |
| `projects/shell/src/app/app.ts` | Added PWA initialization and UpdateAvailableComponent import |
| `projects/shell/src/app/app.config.ts` | Added ServiceWorker provider |
| `projects/shell/src/app/app.html` | Added update-available component |
| `angular.json` | Enabled service worker in shell build configuration |

## Architecture

### PwaService

Located in `projects/shared/src/lib/pwa.service.ts`, this service handles:

```typescript
// Update Detection
- checkForUpdates()
- getUpdateAvailable(): Observable<boolean>
- updateNow(): Promise<void>

// Online/Offline Detection
- isOnline: Signal<boolean>
- getOnlineStatus(): Observable<boolean>

// Installation Prompts
- isInstallPromptAvailable: Signal<boolean>
- installApp(): Promise<void>
- getInstallPromptAvailable(): Observable<boolean>

// Utilities
- getState(): PWAState
- unregisterServiceWorker(): Promise<void>
- clearAllCaches(): Promise<void>
- getCachedItems(): Promise<Map<string, string[]>>
```

### UpdateAvailableComponent

Displays:
- **Update Banner**: When a new version is available
- **Install Banner**: When the app is installable
- **Offline Banner**: When the user is offline
- **Online Restored Banner**: When connection is restored after offline mode

### Service Worker Configuration (ngsw-config.json)

#### Asset Groups

1. **app**: Prefetch strategy for core app files (index.html, CSS, JS)
2. **assets**: Lazy load strategy for images and media
3. **mfe-remoteentries**: Lazy load for remote MFE entry files
4. **mfe-assets**: Lazy load for MFE-specific assets

#### Data Groups

1. **api-cache**: Performance strategy for local APIs
2. **mfe-api-cache**: Freshness strategy for MFE APIs
3. **external-api**: Network-first strategy for external APIs

### Web App Manifest (manifest.webmanifest)

Provides:
- App name and short name
- App description and icons (multiple sizes)
- Theme and background colors
- Display mode (standalone)
- App shortcuts for quick access
- Screenshots for installation UI

## Usage

### For Users

#### Installing the App

1. Open the application in a modern browser
2. Look for the install banner at the top
3. Click "Install" to add the app to your device
4. The app can now be launched from your home screen/app drawer

#### Receiving Updates

1. An update banner appears when a new version is available
2. Click "Update Now" to install the latest version
3. The app will refresh with the new version

#### Working Offline

1. The app uses cached content when offline
2. An offline banner indicates you're offline
3. Previously accessed pages and data remain available
4. API calls will fail gracefully with cached data or offline fallback

### For Developers

#### Initializing PWA Service

```typescript
import { PwaService } from 'shared';

export class MyComponent {
  private pwaService = inject(PwaService);

  ngOnInit() {
    // Listen for updates
    this.pwaService.getUpdateAvailable().subscribe(() => {
      console.log('Update available!');
    });

    // Check online status
    this.pwaService.getOnlineStatus().subscribe(isOnline => {
      console.log('Online:', isOnline);
    });
  }
}
```

#### Checking PWA State

```typescript
const state = this.pwaService.getState();
console.log(state);
// Output:
// {
//   isOnline: true,
//   hasUpdate: false,
//   isInstallPromptAvailable: true,
//   isInstalledApp: false
// }
```

#### Checking for Updates Manually

```typescript
await this.pwaService.checkForUpdates();
```

#### Triggering App Installation Programmatically

```typescript
await this.pwaService.installApp();
```

#### Clearing Cache (for debugging)

```typescript
await this.pwaService.clearAllCaches();
```

#### Getting Cached Items

```typescript
const cachedItems = await this.pwaService.getCachedItems();
cachedItems.forEach((urls, cacheName) => {
  console.log(`Cache: ${cacheName}`);
  console.log('Cached URLs:', urls);
});
```

## Building for Production

### Build the Shell Application

```bash
npm run build:shell
```

This will:
1. Compile the Angular application
2. Generate the Service Worker file
3. Create the `ngsw.json` manifest
4. Bundle all assets with proper caching headers

### Service Worker Output

After building, the following files are generated in `dist/shell`:

- `ngsw-worker.js` - Service Worker script
- `ngsw.json` - Service Worker manifest with cache hashing
- `manifest.webmanifest` - Web App Manifest

## Browser Support

### PWA Features by Browser

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Workers | ✅ | ✅ | ⚠️ (iOS 16.1+) | ✅ |
| Web App Install | ✅ | ✅ | ⚠️ (Limited) | ✅ |
| Manifest Support | ✅ | ✅ | ⚠️ (Limited) | ✅ |
| Offline Access | ✅ | ✅ | ⚠️ | ✅ |

## Caching Strategies

### Performance Strategy
- **Used for**: Local APIs (`/api/**`)
- **Behavior**: Serve from cache if available, update cache in background
- **TTL**: 1 day

### Freshness Strategy
- **Used for**: MFE APIs
- **Behavior**: Network first with 5s timeout, fallback to cache
- **TTL**: 12 hours

### Network-First Strategy
- **Used for**: External APIs
- **Behavior**: Try network first with 10s timeout, fallback to cache
- **TTL**: 24 hours

## Troubleshooting

### Service Worker Not Registering

1. Check that the app is served over HTTPS (or localhost for development)
2. Verify `provideServiceWorker` is added to app configuration
3. Check browser console for errors
4. In DevTools → Application → Service Workers, look for registration errors

### Updates Not Appearing

1. Clear browser cache and reload
2. Check Service Worker status: `DevTools → Application → Service Workers`
3. Look for VERSION_READY events in console logs
4. Verify `ngsw.json` was generated during build

### Offline Fallback Not Working

1. Ensure offline page is included in asset group
2. Check cache storage size limits
3. Verify network conditions in DevTools (set to offline)
4. Check browser console for service worker errors

### Cache Getting Too Large

1. Adjust `maxSize` in ngsw-config.json
2. Remove old caches via `clearAllCaches()` in PWA service
3. Implement cache versioning with deployment

## Performance Tips

### Optimize Cache Size
```json
{
  "dataGroups": [
    {
      "maxSize": 50,
      "maxAge": "12h"
    }
  ]
}
```

### Selective Asset Caching
```json
{
  "assetGroups": [
    {
      "resources": {
        "files": ["/index.html", "/*.css", "/*.js"]
      }
    }
  ]
}
```

### Check Cached Size
```typescript
const cacheNames = await caches.keys();
for (const name of cacheNames) {
  const cache = await caches.open(name);
  const size = (await cache.keys()).length;
  console.log(`${name}: ${size} items`);
}
```

## Security Considerations

1. **HTTPS Required**: PWA features require HTTPS in production
2. **Service Worker Scope**: Restricted to app's origin
3. **Cache Validation**: Service Worker validates cache integrity
4. **Content Integrity**: Hashed content prevents tampering
5. **API Endpoints**: Secure authentication interceptors in place

## Testing

### Test Online/Offline Switching

```typescript
// DevTools → Network → Throttle → Offline
// or programmatically
window.dispatchEvent(new Event('offline'));
window.dispatchEvent(new Event('online'));
```

### Test Service Worker Updates

1. Modify a cached file and rebuild
2. Open DevTools → Application → Service Workers
3. Look for new Service Worker version
4. Update notification should appear

### Test Installation

1. Open DevTools → Manifest tab
2. Verify manifest.json loads correctly
3. Check install prompt appears
4. Test installation flow

## Deployment Considerations

### Web Server Configuration

Ensure proper headers for Service Worker:

```nginx
# nginx.conf
add_header Service-Worker-Allowed "/";
add_header Cache-Control "public, max-age=3600";
```

### Docker Configuration

Already configured in `docker-compose.yml` and `Dockerfile.shell`.

### CDN Considerations

- Service Worker must be served with `Cache-Control: no-cache`
- `ngsw.json` must not be cached
- Versioned assets can be cached indefinitely

## Monitoring

### Log PWA State

```typescript
const state = this.pwaService.getState();
console.log('[PWA]', state);
```

### Monitor Update Events

```typescript
this.pwaService.getUpdateAvailable().subscribe(() => {
  console.log('[PWA] Update available event fired');
  // Send analytics
});
```

### Monitor Offline Events

```typescript
this.pwaService.getOnlineStatus().subscribe(isOnline => {
  console.log('[PWA] Online status:', isOnline);
  // Send analytics
});
```

## Resources

- [Angular Service Worker Documentation](https://angular.io/guide/service-worker-intro)
- [Web.dev PWA Guidance](https://web.dev/progressive-web-apps/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web App Manifest Specification](https://www.w3.org/TR/appmanifest/)

## Support

For issues or questions regarding PWA implementation:

1. Check browser console for error messages
2. Review DevTools → Application tab for Service Worker status
3. Verify network requests in DevTools → Network tab
4. Check PWA state using `pwaService.getState()`
5. Review [troubleshooting section](#troubleshooting)
