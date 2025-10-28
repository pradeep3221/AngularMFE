# Technical Implementation Guide - PWA for Angular MFE

## 📖 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Service Implementation](#service-implementation)
4. [Configuration Details](#configuration-details)
5. [Browser APIs & Integration](#browser-apis--integration)
6. [Caching Strategies](#caching-strategies)
7. [Performance Optimization](#performance-optimization)
8. [Security & Best Practices](#security--best-practices)
9. [Troubleshooting Reference](#troubleshooting-reference)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────┐
│         Client Browser                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    Angular Shell Application         │  │
│  │  ┌────────────────────────────────┐  │  │
│  │  │  Root Component (app.ts)       │  │  │
│  │  │  - PwaService injection        │  │  │
│  │  │  - UpdateAvailable component   │  │  │
│  │  │  - MFE Router Outlet           │  │  │
│  │  └────────────────────────────────┘  │  │
│  │                                        │  │
│  │  ┌────────────────────────────────┐  │  │
│  │  │  PwaService (from Shared)      │  │  │
│  │  │  - Update Detection            │  │  │
│  │  │  - Offline Status              │  │  │
│  │  │  - Install Prompts             │  │  │
│  │  │  - Cache Management            │  │  │
│  │  └────────────────────────────────┘  │  │
│  │                                        │  │
│  │  ┌────────────────────────────────┐  │  │
│  │  │  Service Worker (ngsw)         │  │  │
│  │  │  - Asset Caching               │  │  │
│  │  │  - API Caching                 │  │  │
│  │  │  - Background Sync             │  │  │
│  │  │  - Navigation Fallback         │  │  │
│  │  └────────────────────────────────┘  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    Shared Library                    │  │
│  │  - PwaService export                 │  │
│  │  - Shared utilities                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    Module Federation                 │  │
│  │  - MFE1: Dashboard                   │  │
│  │  - MFE2: User Management             │  │
│  │  - MFE3: Authentication              │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
        Network              Storage
       (Online API)       (IndexedDB, Cache API)
```

---

## Core Components

### 1. PwaService (projects/shared/src/lib/pwa.service.ts)

**Purpose**: Core service managing all PWA functionality

**Key Signals**:
```typescript
// Online/offline status tracking
isOnline: Signal<boolean>

// Update availability flag
hasUpdate: Signal<boolean>

// Installation prompt availability
isInstallPromptAvailable: Signal<boolean>

// Already installed flag
isInstalledApp: Signal<boolean>
```

**Key Methods**:

#### Update Management
```typescript
// Check for new version
async checkForUpdates(): Promise<void>

// Get observable of update events
getUpdateAvailable(): Observable<void>

// Apply update and reload
async updateNow(): Promise<void>
```

#### Status Monitoring
```typescript
// Get online/offline status
getOnlineStatus(): Observable<boolean>

// Get install prompt availability
getInstallPromptAvailable(): Observable<boolean>

// Get current PWA state
getState(): PWAState
```

#### Installation Control
```typescript
// Trigger app installation
async installApp(): Promise<void>
```

#### Cache Management
```typescript
// Get all cached items
async getCachedItems(): Promise<Map<string, string[]>>

// Clear all caches
async clearAllCaches(): Promise<void>

// Unregister service worker
async unregisterServiceWorker(): Promise<void>
```

**Interface Definition**:
```typescript
interface PWAState {
  isOnline: boolean;
  hasUpdate: boolean;
  isInstallPromptAvailable: boolean;
  isInstalledApp: boolean;
}
```

### 2. UpdateAvailableComponent

**Location**: `projects/shell/src/app/components/update-available.component.ts`

**Purpose**: Visual UI for PWA notifications

**Features**:

#### Update Banner
- Appears when `hasUpdate` signal is true
- Shows "Update Now" button
- Async update handling with loading state
- Smooth slide-down animation

#### Install Banner
- Appears when `isInstallPromptAvailable` signal is true
- Shows "Install" button
- Tracks installation success
- Hides after successful installation

#### Offline Banner
- Appears when `isOnline` signal is false
- Shows "You are offline" status
- Disappears when connection restored
- "Back Online" notification with animation

#### Animations
- `slideDown`: Banner entrance animation (300ms)
- `pulse`: Attention animation for update notification (1.5s)
- `spin`: Loading spinner animation

### 3. OfflineFallbackComponent

**Location**: `projects/shell/src/app/components/offline-fallback.component.ts`

**Purpose**: Dedicated offline experience page

**Features**:
- Feature availability checklist
- Reconnection attempt button
- Connection status badge
- Elegant gradient background
- Mobile-responsive design

---

## Service Implementation

### PwaService: Detailed Implementation

#### 1. Initialization

```typescript
constructor(
  private swUpdate: SwUpdate,
  private appRef: ApplicationRef
) {
  this.setupServiceWorkerUpdates();
  this.setupOnlineOfflineDetection();
  this.setupInstallPrompt();
  this.logPWAState('[Init] PWA Service initialized');
}
```

#### 2. Update Detection

```typescript
private setupServiceWorkerUpdates(): void {
  this.swUpdate.versionUpdates
    .pipe(
      filter(event => event.type === 'VERSION_READY'),
      tap(() => {
        this.hasUpdate.set(true);
        this.updateAvailable$.next();
        this.logPWAState('[Update] New version available');
      })
    )
    .subscribe();
}
```

**Update Lifecycle**:
1. Service Worker detects new version
2. `VERSION_READY` event fires
3. `hasUpdate` signal set to true
4. Update banner appears
5. User clicks "Update Now"
6. `updateNow()` applies update and reloads page

#### 3. Online/Offline Detection

```typescript
private setupOnlineOfflineDetection(): void {
  // Initial status
  this.isOnline.set(navigator.onLine);

  merge(
    fromEvent(window, 'online').pipe(tap(() => this.isOnline.set(true))),
    fromEvent(window, 'offline').pipe(tap(() => this.isOnline.set(false)))
  )
    .pipe(
      debounceTime(500),
      tap(isOnline => this.onlineStatus$.next(this.isOnline()))
    )
    .subscribe();
}
```

**Detection Logic**:
1. Check initial `navigator.onLine` status
2. Listen for 'online' and 'offline' events
3. Debounce rapid changes (500ms)
4. Emit status changes via observable
5. Update signal for template binding

#### 4. Installation Prompt Handling

```typescript
private setupInstallPrompt(): void {
  fromEvent<BeforeInstallPromptEvent>(window, 'beforeinstallprompt')
    .pipe(
      tap(event => {
        event.preventDefault();
        this.installPromptEvent = event;
        this.isInstallPromptAvailable.set(true);
        this.installPromptAvailable$.next(true);
        this.logPWAState('[Install] Prompt available');
      })
    )
    .subscribe();

  // Check if already installed
  if ((window.navigator as any).standalone === true) {
    this.isInstalledApp.set(true);
  }
}

async installApp(): Promise<void> {
  if (!this.installPromptEvent) return;
  
  this.installPromptEvent.prompt();
  const result = await this.installPromptEvent.userChoice;
  
  if (result.outcome === 'accepted') {
    this.isInstallPromptAvailable.set(false);
    this.logPWAState('[Install] App installed');
  }
}
```

---

## Configuration Details

### ngsw-config.json Structure

#### Asset Groups

```json
{
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/index.html",
          "/favicon.ico",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "lazy",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)"
        ]
      }
    },
    {
      "name": "mfe-remoteentries",
      "installMode": "lazy",
      "updateMode": "lazy",
      "resources": {
        "urls": [
          "http://localhost:4201/remoteEntry.js",
          "http://localhost:4202/remoteEntry.js",
          "http://localhost:4203/remoteEntry.js"
        ]
      }
    },
    {
      "name": "mfe-assets",
      "installMode": "lazy",
      "updateMode": "lazy",
      "resources": {
        "urls": ["http://localhost:420*/assets/**"]
      }
    }
  ]
}
```

**Strategies**:
- **prefetch**: Downloaded immediately during service worker installation
- **lazy**: Downloaded only when requested

#### Data Groups

```json
{
  "dataGroups": [
    {
      "name": "api-cache",
      "urls": ["/api/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxAge": "1d",
        "maxSize": 100
      }
    },
    {
      "name": "mfe-api-cache",
      "urls": ["http://localhost:420*/api/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxAge": "12h",
        "maxSize": 100
      }
    },
    {
      "name": "external-api",
      "urls": ["https://**"],
      "cacheConfig": {
        "strategy": "network-first",
        "timeout": 10000,
        "maxAge": "24h",
        "maxSize": 50
      }
    }
  ]
}
```

**Strategy Details**:

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| **performance** | Cache first, then network | Stable internal APIs |
| **freshness** | Network first (5s timeout), then cache | API data that may change |
| **network-first** | Network first (10s timeout), then cache | External APIs, user data |

---

## Browser APIs & Integration

### Service Worker Registration

```typescript
// In app.config.ts
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable',
})
```

**Registration Strategies**:
- `registerWhenStable`: Register when app is stable (default, recommended)
- `registerWithDelay`: Register after delay
- `registerImmediately`: Register immediately

### SwUpdate API

```typescript
// Detect version updates
swUpdate.versionUpdates.subscribe(event => {
  if (event.type === 'VERSION_READY') {
    // New version available
  }
});

// Check for updates manually
swUpdate.checkForUpdates();
```

### Cache API

```typescript
// Access caches
const cacheNames = await caches.keys();

for (const name of cacheNames) {
  const cache = await caches.open(name);
  const requests = await cache.keys();
  
  for (const request of requests) {
    console.log(request.url);
  }
}
```

### Web App Manifest

```json
{
  "name": "Angular MFE",
  "short_name": "MFE",
  "description": "Angular Microfrontend PWA",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    }
    // ... more sizes
  ],
  "screenshots": [
    {
      "src": "/assets/screenshots/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View your dashboard",
      "url": "/dashboard",
      "icons": [
        {
          "src": "/assets/icons/dashboard.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

---

## Caching Strategies

### Performance Strategy (Cache-First)

**When to use**: Static or rarely-changing data

```
Request → Cache Hit? → Return cached data
            ↓
           No → Fetch from network → Update cache → Return data
```

**Pros**:
- ✅ Fastest response times
- ✅ Works offline

**Cons**:
- ❌ May serve outdated data
- ❌ Requires manual invalidation

### Freshness Strategy (Network-First with Timeout)

**When to use**: Dynamic data that should be fresh

```
Request → Fetch from network (5s timeout)
         ↓
      Success? → Cache & return
         ↓
        No → Use cached data
         ↓
      No cache? → Return offline error
```

**Pros**:
- ✅ Gets latest data when possible
- ✅ Falls back to cache on error
- ✅ Works offline with cache

**Cons**:
- ❌ Slower on slow networks (5s wait)
- ❌ Requires network timeout handling

### Network-First Strategy (Network-First with Long Timeout)

**When to use**: External APIs that must be current

```
Request → Fetch from network (10s timeout)
         ↓
      Success? → Cache & return
         ↓
        No → Use cached data
         ↓
      No cache? → Return offline error
```

**Pros**:
- ✅ Always gets latest data when possible
- ✅ Works offline with cache fallback

**Cons**:
- ❌ Slower response times
- ❌ Longer timeout period

---

## Performance Optimization

### Bundle Size Impact

```
Feature              | Size
---------------------|--------
PwaService          | ~8 KB
UpdateAvailableComp | ~5 KB
OfflineFallbackComp | ~4 KB
ngsw worker         | ~12 KB
---------------------|--------
Total               | ~29 KB
```

### Cache Size Management

```typescript
// Monitor cache sizes
async getCacheStats(): Promise<void> {
  if (!('estimate' in navigator.storage)) return;
  
  const estimate = await navigator.storage.estimate();
  console.log(`Storage: ${estimate.usage}/${estimate.quota} bytes`);
}

// Implement cache cleanup
async cleanOldCaches(): Promise<void> {
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  for (const [name, metadata] of this.cacheMetadata) {
    if (now - metadata.created > maxAge) {
      await caches.delete(name);
    }
  }
}
```

### Lazy Loading Optimization

```typescript
// Load MFE assets lazily
const mfeAssets = ['http://localhost:4201/assets/**'];
// These are only cached when requested, not on init
```

---

## Security & Best Practices

### HTTPS Requirement

```
Development: ✅ Allowed on localhost
Production:  ❌ HTTPS mandatory
```

### Service Worker Scope

```typescript
// Service Worker only handles requests within its scope
// /ngsw-worker.js → scope: /
// Can't access parent paths
```

### Cache Validation

```typescript
// Hashed content prevents tampering
// ngsw.json contains SHA-256 hashes of all cached files
// Invalid content is rejected
```

### API Security

```typescript
// Secure headers in HTTP interceptor
headers: HttpHeaders = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'">
```

---

## Troubleshooting Reference

### Issue: Service Worker Not Registering

**Symptoms**:
- No service worker in DevTools → Application → Service Workers
- Offline functionality not working

**Solutions**:
1. Check HTTPS/localhost requirement
2. Verify `provideServiceWorker` in app.config.ts
3. Check browser console for registration errors
4. Clear cache and hard refresh (Ctrl+Shift+R)
5. Verify `ngsw-config.json` syntax

### Issue: Updates Not Appearing

**Symptoms**:
- Update banner doesn't show when new version deployed
- VERSION_READY event never fires

**Solutions**:
1. Build with proper versioning
2. Verify `ngsw.json` is regenerated during build
3. Clear all caches: `await pwaService.clearAllCaches()`
4. Check Service Worker update interval
5. Hard refresh browser (Ctrl+Shift+R)

### Issue: Cache Conflicts

**Symptoms**:
- Old cached files preventing updates
- Users seeing outdated content

**Solutions**:
1. Verify asset versioning in build
2. Check cache name patterns in ngsw.json
3. Implement cache invalidation strategy
4. Use unique asset file names with hashes
5. Monitor cache keys via DevTools

### Issue: Large Cache Size

**Symptoms**:
- Storage quota exceeded
- Offline functionality degraded

**Solutions**:
1. Reduce `maxSize` in data groups
2. Adjust `maxAge` for cache expiration
3. Implement cache cleanup logic
4. Remove unnecessary asset groups
5. Monitor storage using `navigator.storage.estimate()`

---

## Performance Metrics

### Key Metrics to Monitor

```typescript
// Measure PWA initialization time
const start = performance.now();
this.pwaService.setupServiceWorkerUpdates();
const end = performance.now();
console.log(`[PWA] Init time: ${end - start}ms`);

// Monitor cache size
const cachedItems = await this.pwaService.getCachedItems();
console.log(`[PWA] Cached items: ${totalCount}`);

// Track online/offline transitions
this.pwaService.getOnlineStatus().subscribe(isOnline => {
  console.log(`[PWA] Online: ${isOnline}`);
});
```

### Lighthouse PWA Score

Ideal Configuration:
- ✅ Installable app (manifest.webmanifest)
- ✅ Service Worker registered
- ✅ HTTPS required
- ✅ Responsive design
- ✅ Works offline (at least home page)

---

## References

- [Angular Service Worker Guide](https://angular.io/guide/service-worker-intro)
- [ngsw-config Schema](https://angular.io/guide/service-worker-config)
- [Web App Manifest W3C Spec](https://www.w3.org/TR/appmanifest/)
- [Cache API MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Service Worker MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Previous**: [Quick Start Guide](../guides/01-QUICK_START.md)  
**Next**: [Complete Summary](./02-COMPLETE_SUMMARY.md)
