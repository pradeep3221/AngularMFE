import { Configuration, BrowserCacheLocation, LogLevel } from '@azure/msal-browser';

/**
 * Azure AD B2C Configuration for Microfrontend Architecture
 * 
 * This configuration implements:
 * - OIDC with Azure AD B2C as the centralized IdP
 * - PKCE for secure SPA flows
 * - Secure token storage using sessionStorage (can be enhanced with httpOnly cookies)
 * - SSO across all microfrontends
 */

// Environment-specific configuration
export const environment = {
  production: false,
  msalConfig: {
    auth: {
      // Replace with your Azure AD B2C tenant details
      clientId: 'your-client-id-here', // Application (client) ID from Azure portal
      authority: 'https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/B2C_1_signupsignin', // B2C policy endpoint
      knownAuthorities: ['your-tenant.b2clogin.com'], // B2C tenant domain
      redirectUri: '/', // Will be dynamically set based on current origin
      postLogoutRedirectUri: '/' // Will be dynamically set based on current origin
    }
  }
};

/**
 * MSAL Configuration with Security Best Practices
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: environment.msalConfig.auth.clientId,
    authority: environment.msalConfig.auth.authority,
    knownAuthorities: environment.msalConfig.auth.knownAuthorities,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
    navigateToLoginRequestUrl: true,
    // Enable PKCE for enhanced security
    clientCapabilities: ['CP1'] // This enables PKCE
  },
  cache: {
    // Use sessionStorage for better security (tokens cleared when browser closes)
    // In production, consider implementing httpOnly cookie storage
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false, // Set to true for IE11 or Edge legacy support
    secureCookies: true // Ensure cookies are secure in production
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string) => {
        // Only log errors and warnings in production
        if (!environment.production || level === LogLevel.Error || level === LogLevel.Warning) {
          console.log(`MSAL [${LogLevel[level]}]: ${message}`);
        }
      },
      logLevel: environment.production ? LogLevel.Warning : LogLevel.Verbose,
      piiLoggingEnabled: !environment.production
    },
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    asyncPopups: false
  }
};

/**
 * Scopes for API access
 * Define the permissions your application needs
 */
export const apiConfig = {
  scopes: [
    'openid',
    'profile',
    'email',
    // Add your custom API scopes here
    // Example: 'https://your-tenant.onmicrosoft.com/api/read'
  ],
  uri: 'https://your-api-endpoint.com/api' // Your protected API endpoint
};

/**
 * Login request configuration
 */
export const loginRequest = {
  scopes: apiConfig.scopes,
  prompt: 'select_account' // Forces account selection for better UX
};

/**
 * Silent token request configuration
 */
export const silentRequest = {
  scopes: apiConfig.scopes,
  forceRefresh: false // Set to true to skip cache and force refresh
};

/**
 * Protected resource map for automatic token attachment
 * Maps API endpoints to their required scopes
 */
export const protectedResourceMap = new Map([
  [apiConfig.uri, apiConfig.scopes],
  // Add more protected resources as needed
  // ['https://another-api.com', ['scope1', 'scope2']]
]);

/**
 * Token validation configuration
 */
export const tokenConfig = {
  // Token refresh threshold (refresh when token expires in less than 5 minutes)
  refreshThresholdMinutes: 5,
  // Maximum token age before forcing re-authentication (24 hours)
  maxTokenAgeHours: 24,
  // Clock skew tolerance for token validation (5 minutes)
  clockSkewMinutes: 5
};

/**
 * Cross-MFE communication configuration
 */
export const mfeConfig = {
  // Event names for cross-MFE authentication state synchronization
  events: {
    LOGIN_SUCCESS: 'mfe:auth:login:success',
    LOGOUT_SUCCESS: 'mfe:auth:logout:success',
    TOKEN_ACQUIRED: 'mfe:auth:token:acquired',
    TOKEN_EXPIRED: 'mfe:auth:token:expired',
    AUTH_ERROR: 'mfe:auth:error'
  },
  // Storage keys for shared authentication state
  storage: {
    AUTH_STATE: 'mfe:auth:state',
    USER_INFO: 'mfe:auth:user',
    TOKEN_CACHE: 'mfe:auth:tokens'
  }
};

/**
 * Security headers configuration
 */
export const securityConfig = {
  headers: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://login.microsoftonline.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.b2clogin.com https://login.microsoftonline.com;",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
};

/**
 * Development configuration overrides
 */
export const devConfig = {
  // Allow localhost for development
  redirectUri: 'http://localhost:4200',
  postLogoutRedirectUri: 'http://localhost:4200',
  // Relaxed CSP for development
  csp: "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob:;"
};

/**
 * Get environment-specific configuration
 */
export function getAuthConfig(): Configuration {
  const config = { ...msalConfig };

  if (!environment.production) {
    // Apply development overrides
    config.auth.redirectUri = devConfig.redirectUri;
    config.auth.postLogoutRedirectUri = devConfig.postLogoutRedirectUri;
  }

  return config;
}

/**
 * Validate configuration before initialization
 */
export function validateAuthConfig(): boolean {
  // For development, allow demo configuration
  if (!environment.production) {
    console.warn('Using demo authentication configuration for development');
    return true;
  }

  const requiredFields = [
    environment.msalConfig.auth.clientId,
    environment.msalConfig.auth.authority,
    environment.msalConfig.auth.knownAuthorities
  ];

  const isValid = requiredFields.every(field => field && field !== 'your-client-id-here' && field !== 'your-tenant');

  if (!isValid) {
    console.error('MSAL Configuration Error: Please update the auth configuration with your Azure AD B2C details');
  }

  return isValid;
}
