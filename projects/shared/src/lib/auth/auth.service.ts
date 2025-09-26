import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
  SilentRequest,
  RedirectRequest,
  PopupRequest,
  EndSessionRequest,
  InteractionRequiredAuthError,
  BrowserAuthError
} from '@azure/msal-browser';
import { BehaviorSubject, Observable, from, throwError, timer, EMPTY } from 'rxjs';
import { map, catchError, switchMap, filter, take } from 'rxjs/operators';

import {
  getAuthConfig,
  loginRequest,
  silentRequest,
  tokenConfig,
  mfeConfig,
  validateAuthConfig,
  environment
} from './auth.config';
import { DemoAuthService } from './demo-auth.service';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  tenantId: string;
  preferredUsername: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly demoAuthService = inject(DemoAuthService);

  private msalInstance: PublicClientApplication | null = null;
  public readonly authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    isLoading: true,
    error: null
  });

  private readonly authStateSubject = new BehaviorSubject<AuthState>(this.authState());
  private tokenRefreshTimer: any;

  // Public reactive state
  public readonly authState$ = this.authStateSubject.asObservable();
  public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  public readonly user = computed(() => this.authState().user);
  public readonly isLoading = computed(() => this.authState().isLoading);
  public readonly error = computed(() => this.authState().error);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Use demo service in development
      if (!environment.production) {
        this.initializeDemoAuth();
      } else {
        this.initializeMsal();
      }
    }
  }

  /**
   * Initialize demo authentication for development
   */
  private async initializeDemoAuth(): Promise<void> {
    try {
      console.log('Initializing demo authentication for development');

      // Subscribe to demo auth state changes
      this.demoAuthService.authState$.subscribe(demoState => {
        this.updateAuthState({
          isAuthenticated: demoState.isAuthenticated,
          user: demoState.user,
          accessToken: demoState.accessToken,
          idToken: demoState.idToken,
          isLoading: demoState.isLoading,
          error: demoState.error
        });
      });

      // Initialize with current demo state
      const currentDemoState = this.demoAuthService.authState();
      this.updateAuthState({
        isAuthenticated: currentDemoState.isAuthenticated,
        user: currentDemoState.user,
        accessToken: currentDemoState.accessToken,
        idToken: currentDemoState.idToken,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Demo auth initialization failed:', error);
      this.updateAuthState({
        isLoading: false,
        error: 'Demo authentication initialization failed'
      });
    }
  }

  /**
   * Initialize MSAL instance and handle redirect responses
   */
  private async initializeMsal(): Promise<void> {
    try {
      if (!validateAuthConfig()) {
        throw new Error('Invalid MSAL configuration');
      }

      this.msalInstance = new PublicClientApplication(getAuthConfig());
      await this.msalInstance.initialize();

      // Handle redirect response (for login/logout redirects)
      const response = await this.msalInstance.handleRedirectPromise();
      if (response) {
        await this.handleAuthenticationResult(response);
      }

      // Check for existing authentication
      await this.checkAuthenticationState();

      // Setup cross-MFE communication
      this.setupCrossMfeSync();

      // Setup automatic token refresh
      this.setupTokenRefresh();

    } catch (error) {
      console.error('MSAL initialization failed:', error);
      this.updateAuthState({
        isLoading: false,
        error: 'Authentication initialization failed'
      });
    }
  }

  /**
   * Check current authentication state
   */
  private async checkAuthenticationState(): Promise<void> {
    if (!this.msalInstance) return;

    try {
      const accounts = this.msalInstance.getAllAccounts();
      
      if (accounts.length > 0) {
        const account = accounts[0];
        
        // Try to get a valid token silently
        const tokenResponse = await this.acquireTokenSilently();
        
        if (tokenResponse) {
          const userProfile = this.extractUserProfile(account, tokenResponse);
          this.updateAuthState({
            isAuthenticated: true,
            user: userProfile,
            accessToken: tokenResponse.accessToken,
            idToken: tokenResponse.idToken,
            isLoading: false,
            error: null
          });
          
          this.broadcastAuthEvent(mfeConfig.events.LOGIN_SUCCESS, userProfile);
        }
      } else {
        this.updateAuthState({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Authentication state check failed:', error);
      this.updateAuthState({ 
        isAuthenticated: false, 
        isLoading: false,
        error: 'Failed to verify authentication state'
      });
    }
  }

  /**
   * Login using redirect flow (recommended for production)
   */
  public async loginRedirect(): Promise<void> {
    if (!environment.production) {
      // Use demo service in development
      return this.demoAuthService.loginRedirect();
    }

    if (!this.msalInstance) {
      throw new Error('MSAL not initialized');
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });

      const request: RedirectRequest = {
        ...loginRequest,
        redirectUri: window.location.origin
      };

      await this.msalInstance.loginRedirect(request);
    } catch (error) {
      console.error('Login redirect failed:', error);
      this.updateAuthState({
        isLoading: false,
        error: 'Login failed. Please try again.'
      });
      throw error;
    }
  }

  /**
   * Login using popup flow (alternative for specific use cases)
   */
  public async loginPopup(): Promise<AuthenticationResult> {
    if (!this.msalInstance) {
      throw new Error('MSAL not initialized');
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const request: PopupRequest = {
        ...loginRequest
      };

      const response = await this.msalInstance.loginPopup(request);
      await this.handleAuthenticationResult(response);
      
      return response;
    } catch (error) {
      console.error('Login popup failed:', error);
      this.updateAuthState({ 
        isLoading: false, 
        error: 'Login failed. Please try again.' 
      });
      throw error;
    }
  }

  /**
   * Logout and clear all tokens
   */
  public async logout(): Promise<void> {
    if (!environment.production) {
      // Use demo service in development
      return this.demoAuthService.logout();
    }

    if (!this.msalInstance) return;

    try {
      this.clearTokenRefreshTimer();
      
      const account = this.msalInstance.getAllAccounts()[0];
      
      if (account) {
        const logoutRequest: EndSessionRequest = {
          account,
          postLogoutRedirectUri: window.location.origin
        };

        // Clear local state immediately
        this.updateAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          idToken: null,
          isLoading: false,
          error: null
        });

        // Broadcast logout to other MFEs
        this.broadcastAuthEvent(mfeConfig.events.LOGOUT_SUCCESS, null);
        
        // Clear MSAL cache
        await this.msalInstance.clearCache();
        
        // Redirect to logout endpoint
        await this.msalInstance.logoutRedirect(logoutRequest);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        idToken: null,
        isLoading: false,
        error: 'Logout completed with warnings'
      });
    }
  }

  /**
   * Get access token silently (with automatic refresh)
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      const tokenResponse = await this.acquireTokenSilently();
      return tokenResponse?.accessToken || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Acquire token silently (handles refresh automatically)
   */
  private async acquireTokenSilently(): Promise<AuthenticationResult | null> {
    if (!this.msalInstance) return null;

    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) return null;

      const request: SilentRequest = {
        ...silentRequest,
        account: accounts[0]
      };

      const response = await this.msalInstance.acquireTokenSilent(request);
      
      // Broadcast token acquisition to other MFEs
      this.broadcastAuthEvent(mfeConfig.events.TOKEN_ACQUIRED, {
        accessToken: response.accessToken,
        expiresOn: response.expiresOn
      });

      return response;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Token expired or requires interaction - redirect to login
        console.warn('Token expired, redirecting to login');
        this.broadcastAuthEvent(mfeConfig.events.TOKEN_EXPIRED, null);
        await this.loginRedirect();
      } else if (error instanceof BrowserAuthError) {
        console.error('Browser auth error:', error);
      }
      
      return null;
    }
  }

  /**
   * Handle authentication result and update state
   */
  private async handleAuthenticationResult(response: AuthenticationResult): Promise<void> {
    if (response && response.account) {
      const userProfile = this.extractUserProfile(response.account, response);
      
      this.updateAuthState({
        isAuthenticated: true,
        user: userProfile,
        accessToken: response.accessToken,
        idToken: response.idToken,
        isLoading: false,
        error: null
      });

      // Broadcast successful login to other MFEs
      this.broadcastAuthEvent(mfeConfig.events.LOGIN_SUCCESS, userProfile);
      
      // Setup token refresh
      this.setupTokenRefresh();
    }
  }

  /**
   * Extract user profile from account and token response
   */
  private extractUserProfile(account: AccountInfo, tokenResponse: AuthenticationResult): UserProfile {
    const claims = tokenResponse.idTokenClaims as any;
    
    return {
      id: account.localAccountId,
      email: account.username,
      name: account.name || claims?.name || 'Unknown User',
      roles: claims?.roles || [],
      tenantId: account.tenantId || '',
      preferredUsername: claims?.preferred_username || account.username
    };
  }

  /**
   * Update authentication state and notify subscribers
   */
  private updateAuthState(updates: Partial<AuthState>): void {
    const currentState = this.authState();
    const newState = { ...currentState, ...updates };
    
    this.authState.set(newState);
    this.authStateSubject.next(newState);
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    this.clearTokenRefreshTimer();
    
    // Refresh token every 30 minutes
    this.tokenRefreshTimer = setInterval(async () => {
      try {
        await this.acquireTokenSilently();
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Clear token refresh timer
   */
  private clearTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Setup cross-MFE authentication synchronization
   */
  private setupCrossMfeSync(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Listen for authentication events from other MFEs
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case mfeConfig.events.LOGIN_SUCCESS:
          if (!this.isAuthenticated()) {
            this.checkAuthenticationState();
          }
          break;
          
        case mfeConfig.events.LOGOUT_SUCCESS:
          if (this.isAuthenticated()) {
            this.updateAuthState({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              idToken: null,
              error: null
            });
          }
          break;
      }
    });
  }

  /**
   * Broadcast authentication events to other MFEs
   */
  private broadcastAuthEvent(eventType: string, data: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    window.postMessage({
      type: eventType,
      data,
      timestamp: Date.now()
    }, window.location.origin);
  }

  /**
   * Check if user has specific role
   */
  public hasRole(role: string): boolean {
    if (!environment.production) {
      return this.demoAuthService.hasRole(role);
    }

    const user = this.user();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasAnyRole(roles: string[]): boolean {
    const user = this.user();
    return roles.some(role => user?.roles?.includes(role)) || false;
  }

  /**
   * Get user claims from ID token
   */
  public getUserClaims(): any {
    if (!this.msalInstance) return null;
    
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;
    
    return accounts[0].idTokenClaims;
  }

  /**
   * Force token refresh
   */
  public async refreshToken(): Promise<boolean> {
    try {
      const response = await this.acquireTokenSilently();
      return !!response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Cleanup on service destruction
   */
  public ngOnDestroy(): void {
    this.clearTokenRefreshTimer();
  }
}
