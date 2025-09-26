import { Configuration, LogLevel, RedirectRequest, SilentRequest } from '@azure/msal-browser';

/**
 * Environment configuration for authentication
 * In production, these values should come from environment variables
 */
export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: 'your-azure-ad-b2c-client-id', // Replace with your actual client ID
      authority: 'https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/B2C_1_signupsignin', // Replace with your authority
      knownAuthorities: ['your-tenant.b2clogin.com'] // Replace with your known authorities
    }
  },
  apiConfig: {
    scopes: ['openid', 'profile', 'email'],
    uri: 'https://your-api-endpoint.com/api' // Replace with your API endpoint
  }
};

/**
 * MSAL Configuration for Azure AD B2C
 * 
 * This configuration enables:
 * - PKCE (Proof Key for Code Exchange) for enhanced security
 * - Secure token storage and management
 * - Cross-origin authentication support
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: environment.msalConfig.auth.clientId,
    authority: environment.msalConfig.auth.authority,
    knownAuthorities: environment.msalConfig.auth.knownAuthorities,
    redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '/',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
    navigateToLoginRequestUrl: true,
    clientCapabilities: ['CP1'] // This enables PKCE
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage for better security
    storeAuthStateInCookie: false, // Set to true for IE11 or Edge compatibility
    secureCookies: true // Use secure cookies in production
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return;
        
        switch (level) {
          case LogLevel.Error:
            console.error('MSAL Error:', message);
            break;
          case LogLevel.Warning:
            console.warn('MSAL Warning:', message);
            break;
          case LogLevel.Info:
            console.info('MSAL Info:', message);
            break;
          case LogLevel.Verbose:
            console.debug('MSAL Debug:', message);
            break;
        }
      },
      logLevel: environment.production ? LogLevel.Warning : LogLevel.Info,
      piiLoggingEnabled: false
    },
    // allowNativeBroker: false, // Disables WAM Broker - removed as not supported in this version
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    asyncPopups: false
  },
  telemetry: {
    application: {
      appName: 'Angular-MFE-Auth',
      appVersion: '1.0.0'
    }
  }
};

/**
 * Login request configuration
 */
export const loginRequest: RedirectRequest = {
  scopes: environment.apiConfig.scopes,
  extraScopesToConsent: ['user.read'],
  prompt: 'select_account'
};

/**
 * Silent token request configuration
 */
export const silentRequest: SilentRequest = {
  scopes: environment.apiConfig.scopes,
  forceRefresh: false
};

/**
 * API configuration for protected resources
 */
export const apiConfig = {
  scopes: environment.apiConfig.scopes,
  uri: environment.apiConfig.uri
};

/**
 * Protected resource map for MSAL interceptor
 */
export const protectedResourceMap = new Map<string, Array<string>>([
  ['https://graph.microsoft.com/v1.0/me', ['user.read']],
  [environment.apiConfig.uri, environment.apiConfig.scopes],
  ['http://localhost:4200/api/', environment.apiConfig.scopes],
  ['http://localhost:4201/api/', environment.apiConfig.scopes],
  ['http://localhost:4202/api/', environment.apiConfig.scopes]
]);

/**
 * Token configuration for automatic refresh
 */
export const tokenConfig = {
  // Refresh token 5 minutes before expiry
  refreshTimeBeforeExpiry: 5 * 60 * 1000,
  // Maximum retry attempts for token refresh
  maxRetryAttempts: 3,
  // Retry delay in milliseconds
  retryDelay: 1000
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
    AUTH_ERROR: 'mfe:auth:error',
    USER_PROFILE_UPDATED: 'mfe:auth:profile:updated'
  },
  // Storage keys for shared authentication state
  storage: {
    AUTH_STATE: 'mfe:auth:state',
    USER_INFO: 'mfe:auth:user',
    TOKEN_CACHE: 'mfe:auth:tokens'
  },
  // Allowed origins for cross-MFE communication
  allowedOrigins: [
    'http://localhost:4200', // Shell
    'http://localhost:4201', // MFE1 Dashboard
    'http://localhost:4202', // MFE2 User Management
    'http://localhost:4203'  // MFE3 Auth
  ]
};

/**
 * Security configuration
 */
export const securityConfig = {
  // Content Security Policy settings
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://login.microsoftonline.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://login.microsoftonline.com', 'https://graph.microsoft.com'],
    'frame-src': ["'self'", 'https://login.microsoftonline.com'],
    'frame-ancestors': ["'self'"]
  },
  // HTTPS enforcement
  enforceHttps: environment.production,
  // Secure cookie settings
  secureCookies: environment.production,
  // CSRF protection
  csrfProtection: true
};

/**
 * Demo configuration for development
 */
export const demoConfig = {
  enabled: !environment.production,
  users: [
    {
      id: 'demo-admin',
      email: 'admin@demo.com',
      name: 'Demo Administrator',
      roles: ['admin', 'user'],
      permissions: ['read', 'write', 'delete', 'admin']
    },
    {
      id: 'demo-user',
      email: 'user@demo.com',
      name: 'Demo User',
      roles: ['user'],
      permissions: ['read', 'write']
    },
    {
      id: 'demo-manager',
      email: 'manager@demo.com',
      name: 'Demo Manager',
      roles: ['manager', 'user'],
      permissions: ['read', 'write', 'manage']
    }
  ]
};

/**
 * Validation function for MSAL configuration
 */
export function validateAuthConfig(): boolean {
  try {
    if (!msalConfig.auth.clientId || msalConfig.auth.clientId === 'your-azure-ad-b2c-client-id') {
      console.warn('MSAL: Using default client ID. Please configure with your Azure AD B2C client ID.');
      return !environment.production; // Allow in development with demo config
    }
    
    if (!msalConfig.auth.authority || msalConfig.auth.authority.includes('your-tenant')) {
      console.warn('MSAL: Using default authority. Please configure with your Azure AD B2C authority.');
      return !environment.production; // Allow in development with demo config
    }
    
    return true;
  } catch (error) {
    console.error('MSAL configuration validation failed:', error);
    return false;
  }
}

/**
 * Get environment-specific configuration
 */
export function getAuthConfig(): Configuration {
  const config = { ...msalConfig };
  
  if (environment.production) {
    // Production-specific overrides
    config.cache!.cacheLocation = 'sessionStorage';
    config.cache!.secureCookies = true;
    config.system!.loggerOptions!.logLevel = LogLevel.Warning;
  } else {
    // Development-specific overrides
    config.system!.loggerOptions!.logLevel = LogLevel.Info;
  }
  
  return config;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  LOGIN_FAILED = 'LOGIN_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

/**
 * Authentication error interface
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}
