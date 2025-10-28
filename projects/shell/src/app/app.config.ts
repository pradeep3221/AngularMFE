import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth, PwaService } from 'shared';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    ...provideAuth(),
    // Register Service Worker for PWA
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.pwa?.enabled ?? environment.production,
      registrationStrategy: 'registerImmediately'
    }),
    // Provide PWA Service
    PwaService
  ]
};
