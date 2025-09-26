/**
 * Authentication Module Exports
 * 
 * This file exports all authentication-related services, guards, components,
 * and configuration for use across microfrontend applications.
 */

// Core authentication services
export { AuthService } from './auth.service';
export { DemoAuthService } from './demo-auth.service';
export type { UserProfile, AuthState } from './auth.service';

// Authentication configuration
export { 
  msalConfig, 
  getAuthConfig, 
  validateAuthConfig,
  apiConfig,
  loginRequest,
  silentRequest,
  protectedResourceMap,
  tokenConfig,
  mfeConfig,
  securityConfig,
  environment
} from './auth.config';

// Route guards
export { 
  AuthGuard, 
  RoleGuard, 
  AdminGuard, 
  GuestGuard, 
  TokenGuard 
} from './auth.guard';

// HTTP interceptors
export { 
  AuthInterceptor, 
  ErrorLoggingInterceptor, 
  TimingInterceptor 
} from './auth.interceptor';

// Authentication components
export { LoginComponent } from './components/login.component';
export { UserProfileComponent } from './components/user-profile.component';
export { UnauthorizedComponent } from './components/unauthorized.component';

// MSAL types and interfaces (re-export for convenience)
export type { 
  AccountInfo, 
  AuthenticationResult, 
  Configuration,
  SilentRequest,
  RedirectRequest,
  PopupRequest,
  EndSessionRequest
} from '@azure/msal-browser';

/**
 * Authentication Module Provider Configuration
 * 
 * Use this function to configure authentication providers in your application
 */
import { Provider } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor, ErrorLoggingInterceptor, TimingInterceptor } from './auth.interceptor';

export function provideAuth(): Provider[] {
  return [
    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorLoggingInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimingInterceptor,
      multi: true
    }
  ];
}

/**
 * Authentication Routes Configuration
 *
 * Common routes that can be used across microfrontends
 */
import { LoginComponent } from './components/login.component';
import { UnauthorizedComponent } from './components/unauthorized.component';
import { AuthGuard, GuestGuard, AdminGuard } from './auth.guard';

export const authRoutes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
    data: { title: 'Sign In' }
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    data: { title: 'Access Denied' }
  }
];

/**
 * Role-based route configuration helper
 */
export function createProtectedRoute(path: string, component: any, requiredRoles?: string[]) {
  return {
    path,
    component,
    canActivate: [AuthGuard],
    data: {
      requiredRoles,
      title: path.charAt(0).toUpperCase() + path.slice(1)
    }
  };
}

/**
 * Admin-only route configuration helper
 */
export function createAdminRoute(path: string, component: any) {
  return {
    path,
    component,
    canActivate: [AuthGuard, AdminGuard],
    data: {
      requiredRoles: ['admin', 'administrator'],
      title: path.charAt(0).toUpperCase() + path.slice(1)
    }
  };
}

/**
 * Authentication utilities
 */
export class AuthUtils {
  /**
   * Check if a JWT token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Extract claims from JWT token
   */
  static getTokenClaims(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  /**
   * Generate a secure random state for PKCE
   */
  static generateRandomString(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }

  /**
   * Create SHA256 hash for PKCE code challenge
   */
  static async createCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

/**
 * Authentication constants
 */
export const AUTH_CONSTANTS = {
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'auth:access_token',
    REFRESH_TOKEN: 'auth:refresh_token',
    USER_PROFILE: 'auth:user_profile',
    RETURN_URL: 'auth:return_url',
    AUTH_STATE: 'auth:state'
  },
  
  TOKEN_TYPES: {
    BEARER: 'Bearer',
    BASIC: 'Basic'
  },
  
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator',
    GUEST: 'guest'
  },
  
  PERMISSIONS: {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    ADMIN: 'admin'
  }
} as const;

/**
 * Type definitions for better TypeScript support
 */
export type AuthRole = typeof AUTH_CONSTANTS.ROLES[keyof typeof AUTH_CONSTANTS.ROLES];
export type AuthPermission = typeof AUTH_CONSTANTS.PERMISSIONS[keyof typeof AUTH_CONSTANTS.PERMISSIONS];

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

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}
