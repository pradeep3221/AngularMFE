import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { 
  MsalService, 
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration 
} from '@azure/msal-angular';
import { 
  AccountInfo, 
  AuthenticationResult,
  SilentRequest,
  RedirectRequest,
  PopupRequest,
  EndSessionRequest,
  InteractionRequiredAuthError,
  EventMessage,
  EventType,
  InteractionStatus
} from '@azure/msal-browser';
import { BehaviorSubject, Observable, Subject, filter, takeUntil, firstValueFrom } from 'rxjs';

import { 
  loginRequest, 
  silentRequest, 
  mfeConfig, 
  demoConfig,
  environment,
  AuthErrorType 
} from '../config/auth.config';
import { AuthState, UserProfile, AuthEvent } from '../auth.module';

/**
 * Authentication Service for MFE3
 * 
 * This service provides:
 * - Azure AD B2C authentication with MSAL
 * - Demo authentication for development
 * - Cross-MFE authentication state synchronization
 * - Automatic token refresh
 * - Role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly msalGuardConfig = inject(MSAL_GUARD_CONFIG);
  
  private readonly destroy$ = new Subject<void>();
  private tokenRefreshTimer: any;

  // Reactive authentication state
  public readonly authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    isLoading: true,
    error: null
  });

  private readonly authStateSubject = new BehaviorSubject<AuthState>(this.authState());

  // Public reactive state
  public readonly authState$ = this.authStateSubject.asObservable();
  public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  public readonly user = computed(() => this.authState().user);
  public readonly isLoading = computed(() => this.authState().isLoading);
  public readonly error = computed(() => this.authState().error);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuthentication();
    }
  }

  /**
   * Initialize authentication system
   */
  private async initializeAuthentication(): Promise<void> {
    try {
      if (demoConfig.enabled) {
        console.log('Initializing demo authentication for development');
        this.initializeDemoAuth();
      } else {
        console.log('Initializing Azure AD B2C authentication');
        this.initializeMsalAuth();
      }
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      this.updateAuthState({ 
        isLoading: false, 
        error: 'Authentication initialization failed' 
      });
    }
  }

  /**
   * Initialize demo authentication for development
   */
  private initializeDemoAuth(): void {
    // Check for existing demo session
    const storedUser = localStorage.getItem('demo:auth:user');
    const storedToken = localStorage.getItem('demo:auth:token');

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        this.updateAuthState({
          isAuthenticated: true,
          user,
          accessToken: storedToken,
          idToken: storedToken,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to restore demo session:', error);
        this.clearDemoSession();
      }
    } else {
      this.updateAuthState({ isLoading: false });
    }

    this.setupCrossMfeSync();
  }

  /**
   * Initialize MSAL authentication
   */
  private initializeMsalAuth(): void {
    // Handle redirect response
    this.msalService.handleRedirectObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result) {
            this.handleAuthenticationResult(result);
          }
          this.checkAuthenticationState();
        },
        error: (error) => {
          console.error('MSAL redirect handling failed:', error);
          this.updateAuthState({ 
            isLoading: false, 
            error: 'Authentication redirect failed' 
          });
        }
      });

    // Listen to MSAL events
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this.destroy$)
      )
      .subscribe((result: EventMessage) => {
        const payload = result.payload as AuthenticationResult;
        this.handleAuthenticationResult(payload);
      });

    // Listen to interaction status
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkAuthenticationState();
      });

    this.setupCrossMfeSync();
    this.setupTokenRefresh();
  }

  /**
   * Check current authentication state
   */
  private checkAuthenticationState(): void {
    if (demoConfig.enabled) {
      // Demo auth state is already handled in initializeDemoAuth
      return;
    }

    try {
      const accounts = this.msalService.instance.getAllAccounts();
      
      if (accounts.length > 0) {
        const account = accounts[0];
        this.msalService.instance.setActiveAccount(account);
        
        // Try to get a valid token silently
        this.acquireTokenSilently().then(tokenResponse => {
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
            
            this.broadcastAuthEvent(AuthEvent.LOGIN_SUCCESS, userProfile);
          }
        }).catch(error => {
          console.error('Silent token acquisition failed:', error);
          this.updateAuthState({ 
            isAuthenticated: false, 
            isLoading: false,
            error: 'Failed to verify authentication state'
          });
        });
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
   * Login using redirect flow
   */
  async loginRedirect(): Promise<void> {
    if (demoConfig.enabled) {
      return this.loginDemo();
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const request: RedirectRequest = {
        ...loginRequest,
        redirectUri: window.location.origin + '/auth/callback'
      };

      await this.msalService.loginRedirect(request);
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
   * Login using popup flow
   */
  async loginPopup(): Promise<AuthenticationResult | null> {
    if (demoConfig.enabled) {
      await this.loginDemo();
      return null;
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const request: PopupRequest = {
        ...loginRequest
      };

      const response = await firstValueFrom(this.msalService.loginPopup(request));
      this.handleAuthenticationResult(response);

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
   * Demo login for development
   */
  private async loginDemo(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, automatically log in as the first user
    const demoUser = demoConfig.users[0];
    const mockToken = this.generateMockToken(demoUser);

    // Store session
    localStorage.setItem('demo:auth:user', JSON.stringify(demoUser));
    localStorage.setItem('demo:auth:token', mockToken);

    this.updateAuthState({
      isAuthenticated: true,
      user: demoUser,
      accessToken: mockToken,
      idToken: mockToken,
      isLoading: false,
      error: null
    });

    this.broadcastAuthEvent(AuthEvent.LOGIN_SUCCESS, demoUser);
    console.log('Demo login successful:', demoUser);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    if (demoConfig.enabled) {
      return this.logoutDemo();
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      this.clearTokenRefreshTimer();
      
      const logoutRequest: EndSessionRequest = {
        postLogoutRedirectUri: window.location.origin
      };

      // Broadcast logout before actual logout
      this.broadcastAuthEvent(AuthEvent.LOGOUT_SUCCESS, null);
      
      await this.msalService.logoutRedirect(logoutRequest);
    } catch (error) {
      console.error('Logout failed:', error);
      this.updateAuthState({ 
        isLoading: false, 
        error: 'Logout failed' 
      });
      throw error;
    }
  }

  /**
   * Demo logout for development
   */
  private async logoutDemo(): Promise<void> {
    this.clearDemoSession();
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      idToken: null,
      isLoading: false,
      error: null
    });

    this.broadcastAuthEvent(AuthEvent.LOGOUT_SUCCESS, null);
    console.log('Demo logout successful');
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    if (demoConfig.enabled) {
      return this.authState().accessToken;
    }

    try {
      const tokenResponse = await this.acquireTokenSilently();
      return tokenResponse?.accessToken || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.user();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.user();
    return roles.some(role => user?.roles?.includes(role)) || false;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.user();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Switch demo user (for testing different roles)
   */
  async switchDemoUser(userIndex: number): Promise<void> {
    if (!demoConfig.enabled || userIndex < 0 || userIndex >= demoConfig.users.length) {
      throw new Error('Invalid demo user index or demo mode not enabled');
    }

    const demoUser = demoConfig.users[userIndex];
    const mockToken = this.generateMockToken(demoUser);

    // Store session
    localStorage.setItem('demo:auth:user', JSON.stringify(demoUser));
    localStorage.setItem('demo:auth:token', mockToken);

    this.updateAuthState({
      isAuthenticated: true,
      user: demoUser,
      accessToken: mockToken,
      idToken: mockToken,
      isLoading: false,
      error: null
    });

    this.broadcastAuthEvent(AuthEvent.USER_PROFILE_UPDATED, demoUser);
    console.log('Switched to demo user:', demoUser);
  }

  /**
   * Get available demo users
   */
  getDemoUsers(): any[] {
    return demoConfig.enabled ? [...demoConfig.users] : [];
  }

  /**
   * Acquire token silently
   */
  private async acquireTokenSilently(): Promise<AuthenticationResult | null> {
    if (!this.msalService.instance.getActiveAccount()) {
      return null;
    }

    try {
      const request: SilentRequest = {
        ...silentRequest,
        account: this.msalService.instance.getActiveAccount()!
      };

      return await firstValueFrom(this.msalService.acquireTokenSilent(request));
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Token expired or interaction required
        console.warn('Silent token acquisition failed, interaction required');
        this.broadcastAuthEvent(AuthEvent.TOKEN_EXPIRED, null);
      }
      throw error;
    }
  }

  /**
   * Handle authentication result
   */
  private handleAuthenticationResult(result: AuthenticationResult): void {
    if (result.account) {
      this.msalService.instance.setActiveAccount(result.account);
      const userProfile = this.extractUserProfile(result.account, result);

      this.updateAuthState({
        isAuthenticated: true,
        user: userProfile,
        accessToken: result.accessToken,
        idToken: result.idToken,
        isLoading: false,
        error: null
      });

      this.broadcastAuthEvent(AuthEvent.LOGIN_SUCCESS, userProfile);
    }
  }

  /**
   * Extract user profile from account and token
   */
  private extractUserProfile(account: AccountInfo, tokenResponse: AuthenticationResult): UserProfile {
    const claims = tokenResponse.idTokenClaims as any;

    return {
      id: account.localAccountId,
      email: account.username,
      name: account.name || claims?.name || account.username,
      roles: claims?.roles || ['user'],
      permissions: claims?.permissions || ['read'],
      tenantId: account.tenantId || '',
      preferredUsername: account.username
    };
  }

  /**
   * Setup cross-MFE authentication synchronization
   */
  private setupCrossMfeSync(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Listen for authentication events from other MFEs
    window.addEventListener('message', (event) => {
      if (!mfeConfig.allowedOrigins.includes(event.origin)) return;

      const { type, data } = event.data;

      switch (type) {
        case AuthEvent.LOGIN_SUCCESS:
          if (!this.isAuthenticated()) {
            this.checkAuthenticationState();
          }
          break;

        case AuthEvent.LOGOUT_SUCCESS:
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
   * Broadcast authentication event to other MFEs
   */
  private broadcastAuthEvent(eventType: AuthEvent, data: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const message = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      source: 'mfe3-auth'
    };

    // Broadcast to all allowed origins
    mfeConfig.allowedOrigins.forEach(origin => {
      if (origin !== window.location.origin) {
        window.postMessage(message, origin);
      }
    });

    // Also broadcast to current window for local listeners
    window.postMessage(message, window.location.origin);
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    if (demoConfig.enabled) return; // No token refresh needed for demo

    // Refresh token every 30 minutes
    this.tokenRefreshTimer = setInterval(async () => {
      if (this.isAuthenticated()) {
        try {
          const tokenResponse = await this.acquireTokenSilently();
          if (tokenResponse) {
            this.updateAuthState({
              ...this.authState(),
              accessToken: tokenResponse.accessToken,
              idToken: tokenResponse.idToken
            });
            this.broadcastAuthEvent(AuthEvent.TOKEN_ACQUIRED, tokenResponse);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          this.broadcastAuthEvent(AuthEvent.TOKEN_EXPIRED, null);
        }
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
   * Generate mock JWT token for demo
   */
  private generateMockToken(user: any): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      preferred_username: user.email,
      roles: user.roles,
      permissions: user.permissions,
      tid: 'demo-tenant',
      aud: 'demo-client-id',
      iss: 'https://demo.b2clogin.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    }));
    const signature = btoa('demo-signature');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Clear demo authentication session
   */
  private clearDemoSession(): void {
    localStorage.removeItem('demo:auth:user');
    localStorage.removeItem('demo:auth:token');
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
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTokenRefreshTimer();
  }
}
