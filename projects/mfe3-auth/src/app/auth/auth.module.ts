import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// MSAL Angular
import { MsalModule, MsalService, MsalGuard, MsalInterceptor, MsalBroadcastService, MsalRedirectComponent } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';

// Components
import { LoginComponent } from './login/login.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { AuthCallbackComponent } from './auth-callback/auth-callback.component';

// Services
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';

// Guards
import { AuthGuard, RoleGuard, AdminGuard } from './guards/auth.guard';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';

// Configuration
import { msalConfig, loginRequest } from './config/auth.config';

/**
 * Authentication Module for MFE3
 * 
 * This module provides a complete authentication solution that can be:
 * 1. Used as a standalone MFE for authentication pages
 * 2. Imported by other MFEs for authentication services
 * 3. Exposed via Module Federation for cross-MFE usage
 */
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    LoginComponent,
    UserProfileComponent,
    UnauthorizedComponent,
    AuthCallbackComponent,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent,
        data: { title: 'Sign In' }
      },
      {
        path: 'callback',
        component: AuthCallbackComponent,
        data: { title: 'Authentication Callback' }
      },
      {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [AuthGuard],
        data: { title: 'User Profile' }
      },
      {
        path: 'unauthorized',
        component: UnauthorizedComponent,
        data: { title: 'Access Denied' }
      }
    ]),
    MsalModule.forRoot(
      new PublicClientApplication(msalConfig),
      {
        interactionType: InteractionType.Redirect,
        authRequest: loginRequest
      },
      {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map([
          ['https://graph.microsoft.com/v1.0/me', ['user.read']],
          ['https://localhost:44351/api/', ['api://your-api-client-id/access_as_user']]
        ])
      }
    )
  ],
  providers: [
    // Core authentication services
    AuthService,
    TokenService,
    
    // MSAL services
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    
    // Route guards
    AuthGuard,
    RoleGuard,
    AdminGuard,
    
    // HTTP interceptors
    {
      provide: 'HTTP_INTERCEPTORS',
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: 'HTTP_INTERCEPTORS',
      useClass: MsalInterceptor,
      multi: true
    }
  ],
  exports: [
    // Export components for use in other modules
    LoginComponent,
    UserProfileComponent,
    UnauthorizedComponent
  ]
})
export class AuthModule {
  /**
   * Static method to configure the module with custom settings
   */
  static forRoot(config?: any) {
    return {
      ngModule: AuthModule,
      providers: [
        // Additional providers can be configured here
        ...(config?.providers || [])
      ]
    };
  }
  
  /**
   * Static method for feature modules
   */
  static forFeature() {
    return {
      ngModule: AuthModule,
      providers: []
    };
  }
}

/**
 * Standalone exports for Module Federation
 * These can be imported individually by other MFEs
 */
export { LoginComponent } from './login/login.component';
export { UserProfileComponent } from './user-profile/user-profile.component';
export { UnauthorizedComponent } from './unauthorized/unauthorized.component';
export { AuthCallbackComponent } from './auth-callback/auth-callback.component';

export { AuthService } from './services/auth.service';
export { TokenService } from './services/token.service';

export { AuthGuard, RoleGuard, AdminGuard } from './guards/auth.guard';

export { AuthInterceptor } from './interceptors/auth.interceptor';

export { msalConfig, loginRequest } from './config/auth.config';

/**
 * Type definitions for better TypeScript support
 */
export interface AuthModuleConfig {
  providers?: any[];
  msalConfig?: any;
  apiEndpoints?: Map<string, string[]>;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  accessToken: string | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  preferredUsername: string;
}

/**
 * Authentication events for cross-MFE communication
 */
export enum AuthEvent {
  LOGIN_SUCCESS = 'auth:login:success',
  LOGIN_FAILURE = 'auth:login:failure',
  LOGOUT_SUCCESS = 'auth:logout:success',
  TOKEN_ACQUIRED = 'auth:token:acquired',
  TOKEN_EXPIRED = 'auth:token:expired',
  USER_PROFILE_UPDATED = 'auth:profile:updated'
}

/**
 * Role-based access control constants
 */
export const AUTH_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
  GUEST: 'guest'
} as const;

export type AuthRole = typeof AUTH_ROLES[keyof typeof AUTH_ROLES];
