import { Injectable, signal, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { filter, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface PWAState {
  isOnline: boolean;
  hasUpdate: boolean;
  isInstallPromptAvailable: boolean;
  isInstalledApp: boolean;
}

/**
 * PWA Service for handling service worker updates, offline detection,
 * and PWA installation prompts
 */
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private swUpdate = inject(SwUpdate);

  // Signals for reactive state management
  isOnline = signal(navigator.onLine);
  hasUpdate = signal(false);
  isInstallPromptAvailable = signal(false);
  isInstalledApp = signal(this.checkIsInstalledApp());

  // Subjects for observable patterns
  private updateAvailable$ = new Subject<boolean>();
  private installPromptAvailable$ = new Subject<boolean>();
  private onlineStatusChanged$ = this.createOnlineStatusObservable();

  // Store deferred install prompt
  private deferredPrompt: any;

  // Check for updates interval (in milliseconds)
  private readonly CHECK_UPDATE_INTERVAL = 60000; // 1 minute

  constructor() {
    this.initialize();
  }

  /**
   * Initialize PWA service
   */
  private initialize(): void {
    this.setupServiceWorkerUpdates();
    this.setupOnlineOfflineDetection();
    this.setupInstallPrompt();
    this.logPWACapabilities();
  }

  /**
   * Setup service worker update detection
   */
  private setupServiceWorkerUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      console.warn('[PWA] Service Worker is not enabled');
      return;
    }

    console.log('[PWA] Service Worker enabled - checking for updates');

    // Check for updates immediately
    this.checkForUpdates();

    // Check for updates periodically
    setInterval(() => {
      this.checkForUpdates();
    }, this.CHECK_UPDATE_INTERVAL);

    // Listen for version ready events (update available)
    this.swUpdate.versionUpdates
      .pipe(
        filter(evt => evt.type === 'VERSION_READY'),
        map(evt => {
          console.log('[PWA] Update available', evt);
          return true;
        }),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.hasUpdate.set(true);
        this.updateAvailable$.next(true);
        this.notifyUpdateAvailable();
      });

    // Listen for version installation events
    this.swUpdate.versionUpdates
      .pipe(
        filter(evt => evt.type === 'VERSION_INSTALLATION_FAILED'),
        map(evt => {
          console.error('[PWA] Version installation failed', evt);
          return false;
        })
      )
      .subscribe();
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    try {
      const updateFound = await this.swUpdate.checkForUpdate();
      console.log('[PWA] Update check completed', { updateFound });
    } catch (error) {
      console.error('[PWA] Error checking for updates:', error);
    }
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineOfflineDetection(): void {
    // Create observables for online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    // Merge both streams with debounce
    merge(online$, offline$)
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(status => {
        this.isOnline.set(status);
        console.log(`[PWA] Online status changed: ${status}`);

        if (!status) {
          this.notifyOfflineMode();
        }
      });
  }

  /**
   * Create online status change observable
   */
  private createOnlineStatusObservable(): Observable<boolean> {
    return merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(
      debounceTime(500),
      distinctUntilChanged(),
      distinctUntilChanged()
    );
  }

  /**
   * Setup install prompt for installable PWA
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallPromptAvailable.set(true);
      this.installPromptAvailable$.next(true);
      console.log('[PWA] Install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed successfully');
      this.deferredPrompt = null;
      this.isInstallPromptAvailable.set(false);
      this.isInstalledApp.set(true);
      this.notifyAppInstalled();
    });
  }

  /**
   * Trigger the install prompt
   */
  async installApp(): Promise<void> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`[PWA] User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.isInstallPromptAvailable.set(false);
      }
    } catch (error) {
      console.error('[PWA] Error during app installation:', error);
    }
  }

  /**
   * Manually trigger service worker update
   */
  async updateNow(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
      console.log('[PWA] Update activated, reloading page...');
      window.location.reload();
    } catch (error) {
      console.error('[PWA] Error during update activation:', error);
    }
  }

  /**
   * Get update available observable
   */
  getUpdateAvailable(): Observable<boolean> {
    return this.updateAvailable$.asObservable();
  }

  /**
   * Get install prompt available observable
   */
  getInstallPromptAvailable(): Observable<boolean> {
    return this.installPromptAvailable$.asObservable();
  }

  /**
   * Get online status observable
   */
  getOnlineStatus(): Observable<boolean> {
    return this.onlineStatusChanged$;
  }

  /**
   * Check if running as installed app
   */
  private checkIsInstalledApp(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Get current PWA state
   */
  getState(): PWAState {
    return {
      isOnline: this.isOnline(),
      hasUpdate: this.hasUpdate(),
      isInstallPromptAvailable: this.isInstallPromptAvailable(),
      isInstalledApp: this.isInstalledApp()
    };
  }

  /**
   * Unregister service worker (for debugging)
   */
  async unregisterServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('[PWA] Service Worker unregistered');
        }
      }
    } catch (error) {
      console.error('[PWA] Error unregistering service worker:', error);
    }
  }

  /**
   * Clear all caches (for debugging/cleanup)
   */
  async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[PWA] All caches cleared');
    } catch (error) {
      console.error('[PWA] Error clearing caches:', error);
    }
  }

  /**
   * Get list of cached items
   */
  async getCachedItems(): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    try {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        result.set(
          cacheName,
          requests.map(req => req.url)
        );
      }
    } catch (error) {
      console.error('[PWA] Error getting cached items:', error);
    }
    return result;
  }

  /**
   * Log PWA capabilities and status
   */
  private logPWACapabilities(): void {
    const capabilities = {
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerEnabled: this.swUpdate.isEnabled,
      installPromptAvailable: this.isInstallPromptAvailable(),
      isInstalledApp: this.isInstalledApp(),
      isOnline: this.isOnline()
    };

    console.log('[PWA] Capabilities:', capabilities);
  }

  /**
   * Notify user about available update (can be overridden)
   */
  private notifyUpdateAvailable(): void {
    console.log('[PWA] New version is available. Please refresh to update.');
  }

  /**
   * Notify user about offline mode (can be overridden)
   */
  private notifyOfflineMode(): void {
    console.warn('[PWA] You are now offline. Some features may be limited.');
  }

  /**
   * Notify user about successful app installation (can be overridden)
   */
  private notifyAppInstalled(): void {
    console.log('[PWA] App has been installed successfully!');
  }

  /**
   * Handle visibility change (app goes to background)
   */
  handleVisibilityChange(): void {
    if (document.hidden) {
      console.log('[PWA] App moved to background');
    } else {
      console.log('[PWA] App moved to foreground');
      // Check for updates when app comes to foreground
      this.checkForUpdates();
    }
  }
}
