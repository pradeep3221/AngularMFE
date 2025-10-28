/**
 * Production Environment Configuration
 * Used during `ng build --prod` production build
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
  authUrl: 'https://auth.yourdomain.com',

  // Microfrontend configuration
  mfeConfig: {
    dashboardUrl: 'https://dashboard.yourdomain.com',
    userManagementUrl: 'https://users.yourdomain.com',
    authUrl: 'https://auth.yourdomain.com'
  },

  // PWA configuration
  pwa: {
    enabled: true,
    updateCheckInterval: 3600000, // 1 hour for production
    cacheVersion: 'v1-prod'
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
    enabled: false,
    level: 'error'
  }
};
