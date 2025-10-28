/**
 * Development Environment Configuration
 * Used during `ng serve` development
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  authUrl: 'http://localhost:4203/auth',
  
  // Microfrontend configuration
  mfeConfig: {
    dashboardUrl: 'http://localhost:4201',
    userManagementUrl: 'http://localhost:4202',
    authUrl: 'http://localhost:4203'
  },

  // PWA configuration
  pwa: {
    enabled: true,
    updateCheckInterval: 60000, // 1 minute for development
    cacheVersion: 'v1-dev'
  },

  // Feature flags
  features: {
    pwaSupportEnabled: true,
    offlineModeEnabled: true,
    updateNotificationEnabled: true,
    installPromptEnabled: true
  },

  // Logging
  logging: {
    enabled: true,
    level: 'debug'
  }
};
