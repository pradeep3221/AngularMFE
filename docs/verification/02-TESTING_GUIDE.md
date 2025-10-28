# PWA Testing Guide

## 🧪 Comprehensive Testing Procedures

This guide provides step-by-step testing procedures for all PWA features.

---

## 📋 Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Service Worker Testing](#service-worker-testing)
3. [Update Detection Testing](#update-detection-testing)
4. [Offline Functionality Testing](#offline-functionality-testing)
5. [Installation Testing](#installation-testing)
6. [Performance Testing](#performance-testing)
7. [Cross-Browser Testing](#cross-browser-testing)
8. [Security Testing](#security-testing)
9. [End-to-End Testing](#end-to-end-testing)

---

## Setup & Prerequisites

### Required Tools

```bash
# DevTools (built into browser)
# Chrome/Edge: F12
# Firefox: F12
# Safari: Develop menu

# Command-line tools
npm              # Node Package Manager
ng              # Angular CLI
curl            # HTTP client
docker          # Container runtime (optional)
```

### Build for Testing

```bash
# Production build (required for Service Worker)
npm run build:shell

# Serve locally
npx http-server dist/shell -c-1

# Open in browser
http://localhost:8080
```

---

## Service Worker Testing

### 1. Service Worker Registration

**Objective**: Verify Service Worker registers correctly

**Steps**:

1. Build and serve the app
   ```bash
   npm run build:shell
   npx http-server dist/shell -c-1
   ```

2. Open DevTools (F12)

3. Navigate to Application tab → Service Workers

4. **Verify**:
   - ✅ ngsw-worker.js listed
   - ✅ Status shows "activated and running"
   - ✅ Scope is "/"

**Expected Result**: ✅ Service Worker registered and active

---

### 2. Service Worker File Accessibility

**Objective**: Verify Service Worker file is accessible

**Steps**:

```bash
# Test Service Worker accessibility
curl -I http://localhost:8080/ngsw-worker.js

# Expected output:
# HTTP/1.1 200 OK
# Content-Type: application/javascript
```

**Expected Result**: ✅ Returns HTTP 200

---

### 3. Service Worker Manifest

**Objective**: Verify ngsw.json manifest exists and is valid

**Steps**:

```bash
# Check manifest file
curl http://localhost:8080/ngsw.json | head -20

# Expected output shows structure:
# {
#   "configVersion": 1,
#   "timestamp": ...,
#   "index": "/index.html?ngsw-cache=...",
#   ...
# }
```

**Expected Result**: ✅ Valid JSON manifest with hashing

---

## Update Detection Testing

### 1. Manual Update Check

**Objective**: Verify update checking mechanism

**Steps**:

1. Open browser console
2. Run:
   ```javascript
   navigator.serviceWorker.controller.postMessage({type: 'CHECK_FOR_UPDATES'});
   ```

3. Wait 2-3 seconds
4. Check console output

**Expected Result**: ✅ Console shows update check message

---

### 2. Simulate Update Scenario

**Objective**: Test update notification display

**Steps**:

1. **Modify a file** (e.g., app.ts comment)
   ```typescript
   // Add a comment like: // Update test v2
   ```

2. **Rebuild**
   ```bash
   npm run build:shell
   ```

3. **Keep browser open**, automatically reloads

4. **Observe**:
   - Update banner appears at top
   - Shows "New version available"
   - Has "Update Now" button

**Expected Result**: ✅ Update banner displays with clickable button

---

### 3. Apply Update

**Objective**: Test update installation

**Steps**:

1. When update banner appears, click "Update Now"

2. **Observe**:
   - Button shows loading state
   - Page reloads
   - New version loads

3. **Verify in console**:
   ```javascript
   navigator.serviceWorker.controller.postMessage({type: 'STATE'});
   ```

**Expected Result**: ✅ App reloads with new version

---

## Offline Functionality Testing

### 1. Offline Mode Detection

**Objective**: Verify app detects offline status

**Steps**:

1. Open DevTools (F12) → Network tab

2. Set throttling to "Offline"
   - Dropdown: "Throttling" → select "Offline"

3. **Observe**:
   - Offline banner appears at top
   - Shows "You are offline"
   - Banner has red/warning styling

**Expected Result**: ✅ Offline banner displays immediately

---

### 2. Content Loads from Cache

**Objective**: Verify cached content loads offline

**Steps**:

1. **Online**: Visit multiple pages
   - Dashboard
   - User Management
   - Auth page

2. **Set to Offline** in DevTools

3. **Reload** main page (F5)

4. **Verify**:
   - Page loads from cache
   - No network errors
   - Content displays (may be stale)

**Expected Result**: ✅ Content loads from cache, no 404 errors

---

### 3. Online Restoration

**Objective**: Verify "Back Online" notification

**Steps**:

1. Set DevTools to Offline

2. Wait a few seconds

3. Set back to Online
   - DevTools Throttling → No throttling

4. **Observe**:
   - "Back Online" notification appears
   - Message shows connection restored
   - Notification auto-dismisses

**Expected Result**: ✅ Online restoration detected and notified

---

### 4. Failed Network Requests Offline

**Objective**: Verify graceful handling of offline API calls

**Steps**:

1. Set to Offline in DevTools

2. Try to perform action requiring API call:
   - Click buttons that call APIs
   - Submit forms

3. **Observe**:
   - Request fails gracefully
   - Error message appears (or cached response)
   - App doesn't crash

**Expected Result**: ✅ Graceful error handling, no console errors

---

## Installation Testing

### 1. Install Prompt Detection

**Objective**: Verify install prompt appears

**Steps**:

1. Open app in supported browser
   - Chrome/Edge (best support)
   - Firefox (good support)

2. **Look for install banner** (varies by browser):
   - Chrome: Usually top-right "Install" button
   - Firefox: Browser prompts
   - Custom app banner (if implemented)

3. **Expected**: Install UI appears

**Expected Result**: ✅ Install prompt available

---

### 2. Installation Process

**Objective**: Test app installation

**Steps**:

1. Click "Install" or "Install App" button

2. **Observe**:
   - Install dialog appears
   - Shows app info (icon, name)
   - May show permissions

3. Click "Install" in dialog

4. **Verify**:
   - Dialog closes
   - Install banner disappears
   - App added to:
     - Home screen (mobile)
     - Start menu/app drawer (desktop)

**Expected Result**: ✅ App successfully installed

---

### 3. Installed App Mode

**Objective**: Test running as installed app

**Steps**:

1. **Launch app from home screen/app drawer**

2. **Verify**:
   - No browser chrome (address bar)
   - Standalone app window
   - App icon in taskbar

3. **Test functionality**:
   - Navigation works
   - Updates function
   - Offline mode works

**Expected Result**: ✅ App runs in standalone mode

---

## Performance Testing

### 1. First Load Time

**Objective**: Measure initial load performance

**Steps**:

1. Clear browser cache
   ```javascript
   // DevTools → Application → Storage → Clear site data
   ```

2. Open DevTools → Network tab

3. Reload page

4. **Record metrics**:
   - DOMContentLoaded (target: <1.8s)
   - Load (target: <3s)
   - Total size

5. Note results

**Expected Result**: ✅ Loads within acceptable time

---

### 2. Cached Load Time

**Objective**: Measure subsequent load performance

**Steps**:

1. Reload page normally (cache active)

2. Open DevTools → Network tab

3. Reload page

4. **Record metrics**:
   - DOMContentLoaded (target: <500ms)
   - Load (target: <1s)
   - Total size (should be much smaller)

5. Compare with first load

**Expected Result**: ✅ 60-80% faster than first load

---

### 3. Cache Hit Ratio

**Objective**: Measure cache effectiveness

**Steps**:

1. Open DevTools → Network tab

2. Reload page multiple times

3. **Analyze**:
   - Count requests from cache (show as "from service worker")
   - Count network requests
   - Calculate hit ratio = cached / total

4. **Target**: >70% cache hit ratio

**Expected Result**: ✅ Majority of resources cached

---

### 4. Cache Storage Size

**Objective**: Monitor cache storage usage

**Steps**:

```javascript
// Run in console
navigator.storage.estimate().then(estimate => {
  console.log(`Used: ${estimate.usage} bytes`);
  console.log(`Quota: ${estimate.quota} bytes`);
  console.log(`Percentage: ${(estimate.usage/estimate.quota*100).toFixed(2)}%`);
});
```

**Expected Result**: ✅ Cache under quota (typically <50 MB)

---

### 5. Bundle Size Impact

**Objective**: Verify PWA doesn't significantly increase bundle

**Steps**:

```bash
# Check dist size
du -sh dist/shell/

# Check specific file sizes
ls -lh dist/shell/*.js | head

# Expected:
# - ngsw-worker.js: ~15-20 KB
# - main bundle: baseline + <5 KB
```

**Expected Result**: ✅ Total impact <30 KB

---

## Cross-Browser Testing

### Chrome/Edge Testing

**Steps**:

1. Open in Chrome/Edge
2. Test all PWA features:
   - [ ] Service Worker registers
   - [ ] Install prompt appears
   - [ ] Update notification works
   - [ ] Offline mode works
   - [ ] Installation succeeds

**Expected Result**: ✅ All features work

---

### Firefox Testing

**Steps**:

1. Open in Firefox
2. Test all PWA features (same as Chrome)
3. **Note**: Manifest support may be limited

**Expected Result**: ✅ Core features work

---

### Safari Testing

**Steps**:

1. Open in Safari 16.1+ (iOS)
2. Test features:
   - [ ] Service Worker registers
   - [ ] Offline mode works
   - [ ] Update detection works
   - [ ] Installation (limited support)

**Expected Result**: ⚠️ Core features work, limited installation

---

## Security Testing

### 1. HTTPS Requirement

**Steps**:

1. Test over HTTP (non-production)
   - Service Worker may not register

2. Verify HTTPS works (production)
   - Service Worker should register

**Expected Result**: ✅ Requires HTTPS in production

---

### 2. Content Integrity

**Steps**:

1. Check ngsw.json for hashes
   ```bash
   cat dist/shell/ngsw.json | grep -A 5 '"hash"'
   ```

2. Verify file integrity

**Expected Result**: ✅ Files have SHA-256 hashes

---

### 3. Service Worker Scope

**Steps**:

1. DevTools → Application → Service Workers
2. Check scope: should be "/"
3. Service Worker should not access parent paths

**Expected Result**: ✅ Scope restricted correctly

---

### 4. CSP Headers

**Steps**:

```bash
# Check security headers
curl -I https://your-domain.com/

# Look for:
# Content-Security-Policy: ...
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
```

**Expected Result**: ✅ Security headers present

---

## End-to-End Testing

### Complete User Journey

**Scenario**: New user installs and uses app

**Steps**:

1. **First Visit**
   - [ ] App loads
   - [ ] Install prompt appears
   - [ ] Takes <3 seconds

2. **Installation**
   - [ ] Click install button
   - [ ] App installs successfully
   - [ ] Appears on home screen

3. **Standalone Launch**
   - [ ] Launch from home screen
   - [ ] No browser chrome
   - [ ] App fully functional

4. **Usage**
   - [ ] Navigate between pages
   - [ ] All features work
   - [ ] Perform typical actions

5. **Update Scenario**
   - [ ] New version deployed
   - [ ] Update notification appears
   - [ ] Click "Update Now"
   - [ ] New version loads

6. **Offline Scenario**
   - [ ] Go offline (set network offline)
   - [ ] Offline banner appears
   - [ ] Browse cached pages
   - [ ] Come back online
   - [ ] "Back Online" notification

**Expected Result**: ✅ Seamless PWA experience

---

### Regression Testing

**Objective**: Verify no existing features broken

**Steps**:

1. Test original app features:
   - [ ] Routing works
   - [ ] Authentication works
   - [ ] MFEs load correctly
   - [ ] API calls work

2. Test microfrontends:
   - [ ] MFE1 Dashboard loads
   - [ ] MFE2 User Management loads
   - [ ] MFE3 Auth loads

3. Test API endpoints:
   - [ ] Data loads correctly
   - [ ] Forms submit successfully
   - [ ] Error handling works

**Expected Result**: ✅ No regressions, all features work

---

## Testing Automation

### Cypress E2E Tests

```typescript
// Example: tests/e2e/pwa.cy.ts
describe('PWA Features', () => {
  
  it('should register service worker', () => {
    cy.visit('/')
    cy.window().then(win => {
      cy.wrap(navigator.serviceWorker.getRegistrations())
        .should('have.length.greaterThan', 0)
    })
  })

  it('should load offline', () => {
    cy.visit('/')
    cy.window().then(win => {
      win.dispatchEvent(new Event('offline'))
    })
    cy.reload()
    cy.contains('body', 'content') // Should still show content
  })

  it('should show install banner', () => {
    cy.visit('/')
    cy.get('app-update-available').should('be.visible')
  })
})
```

**Run tests**:
```bash
npm run cypress:open
npm run cypress:run
```

---

## Testing Checklist

### Pre-Testing
- [ ] App built for production
- [ ] Serving locally or staging
- [ ] Browser DevTools available
- [ ] Test environment ready

### Core Testing
- [ ] Service Worker registers
- [ ] Manifest valid
- [ ] Cache Storage populated
- [ ] Offline detection works
- [ ] Update detection works
- [ ] Install prompt appears
- [ ] Installation works

### Advanced Testing
- [ ] Performance metrics acceptable
- [ ] Security headers present
- [ ] Cross-browser compatibility
- [ ] No console errors
- [ ] No breaking changes

### Production Testing
- [ ] HTTPS working
- [ ] All files accessible (200 status)
- [ ] Metrics monitoring
- [ ] User feedback positive

---

## Test Report Template

```markdown
# PWA Testing Report

Date: [Date]
Tester: [Name]
Build Version: [Version]
Browser: [Browser] [Version]

## Results

### Service Worker
- [ ] Registration: PASS / FAIL
- [ ] Manifest: PASS / FAIL
- [ ] Caching: PASS / FAIL

### Updates
- [ ] Detection: PASS / FAIL
- [ ] Notification: PASS / FAIL
- [ ] Installation: PASS / FAIL

### Offline
- [ ] Detection: PASS / FAIL
- [ ] Content Loading: PASS / FAIL
- [ ] Recovery: PASS / FAIL

### Installation
- [ ] Prompt Appearance: PASS / FAIL
- [ ] Installation: PASS / FAIL
- [ ] Standalone Mode: PASS / FAIL

### Performance
- [ ] First Load: [time]ms (Target: <3s)
- [ ] Cached Load: [time]ms (Target: <1s)
- [ ] Cache Hit Ratio: [%] (Target: >70%)

### Security
- [ ] HTTPS: PASS / FAIL
- [ ] CSP Headers: PASS / FAIL
- [ ] Content Integrity: PASS / FAIL

## Issues Found
[List any issues]

## Recommendations
[Any improvements]

## Overall Result: PASS / FAIL
```

---

## Quick Test Commands

```bash
# Build for testing
npm run build:shell

# Serve locally
npx http-server dist/shell -c-1

# Check service worker file
curl -I http://localhost:8080/ngsw-worker.js

# Check manifest
curl http://localhost:8080/manifest.webmanifest

# Check ngsw.json
curl http://localhost:8080/ngsw.json | python -m json.tool

# Monitor cache size
# Run in browser console:
navigator.storage.estimate().then(e => 
  console.log(`${(e.usage/1024/1024).toFixed(2)}MB / ${(e.quota/1024/1024).toFixed(0)}MB`)
)
```

---

## Troubleshooting Test Issues

### Service Worker Not Registering
- Check browser console for errors
- Verify HTTPS/localhost
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache

### Update Not Appearing
- Verify build hash changed
- Clear all caches
- Hard refresh browser
- Check VERSION_READY event

### Offline Tests Failing
- Verify service worker active
- Check Cache Storage populated
- Test in DevTools offline mode
- Check console for SW errors

---

## Next Steps After Testing

- [ ] Document any issues found
- [ ] Fix identified bugs
- [ ] Re-test fixes
- [ ] Get QA sign-off
- [ ] Plan production deployment
- [ ] Set up monitoring
- [ ] Brief team on features

---

**Navigation**:
- [← Back to Checklist](./01-CHECKLIST.md)
- [Deployment Guide →](../deployment/02-DEPLOYMENT_GUIDE.md)
