import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export interface DemoUserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  tenantId: string;
  preferredUsername: string;
}

export interface DemoAuthState {
  isAuthenticated: boolean;
  user: DemoUserProfile | null;
  accessToken: string | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Demo Authentication Service
 * 
 * This service provides a mock authentication implementation for development
 * and demonstration purposes. It simulates the behavior of Azure AD B2C
 * without requiring actual Azure configuration.
 */
@Injectable({
  providedIn: 'root'
})
export class DemoAuthService {
  public readonly authState = signal<DemoAuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    isLoading: false,
    error: null
  });

  private readonly authStateSubject = new BehaviorSubject<DemoAuthState>(this.authState());

  // Public reactive state
  public readonly authState$ = this.authStateSubject.asObservable();
  public readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  public readonly user = computed(() => this.authState().user);
  public readonly isLoading = computed(() => this.authState().isLoading);
  public readonly error = computed(() => this.authState().error);

  // Demo users
  private readonly demoUsers: DemoUserProfile[] = [
    {
      id: 'demo-user-1',
      email: 'admin@demo.com',
      name: 'Demo Administrator',
      roles: ['admin', 'user'],
      tenantId: 'demo-tenant',
      preferredUsername: 'admin@demo.com'
    },
    {
      id: 'demo-user-2',
      email: 'user@demo.com',
      name: 'Demo User',
      roles: ['user'],
      tenantId: 'demo-tenant',
      preferredUsername: 'user@demo.com'
    },
    {
      id: 'demo-user-3',
      email: 'manager@demo.com',
      name: 'Demo Manager',
      roles: ['manager', 'user'],
      tenantId: 'demo-tenant',
      preferredUsername: 'manager@demo.com'
    }
  ];

  constructor() {
    // Check for existing session
    this.checkExistingSession();
  }

  /**
   * Check for existing authentication session
   */
  private checkExistingSession(): void {
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
        this.clearSession();
      }
    }
  }

  /**
   * Simulate login with demo user selection
   */
  async loginRedirect(): Promise<void> {
    this.updateAuthState({ isLoading: true, error: null });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, automatically log in as the first user
    const demoUser = this.demoUsers[0];
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

    console.log('Demo login successful:', demoUser);
  }

  /**
   * Simulate popup login (same as redirect for demo)
   */
  async loginPopup(): Promise<any> {
    await this.loginRedirect();
    return { account: this.user(), accessToken: this.authState().accessToken };
  }

  /**
   * Simulate logout
   */
  async logout(): Promise<void> {
    this.clearSession();
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      idToken: null,
      isLoading: false,
      error: null
    });

    console.log('Demo logout successful');
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    return this.authState().accessToken;
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
   * Get user claims (mock implementation)
   */
  getUserClaims(): any {
    const user = this.user();
    if (!user) return null;

    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      preferred_username: user.preferredUsername,
      roles: user.roles,
      tid: user.tenantId,
      aud: 'demo-client-id',
      iss: 'https://demo.b2clogin.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };
  }

  /**
   * Force token refresh (mock implementation)
   */
  async refreshToken(): Promise<boolean> {
    const user = this.user();
    if (!user) return false;

    // Simulate token refresh
    const newToken = this.generateMockToken(user);
    localStorage.setItem('demo:auth:token', newToken);

    this.updateAuthState({
      ...this.authState(),
      accessToken: newToken,
      idToken: newToken
    });

    return true;
  }

  /**
   * Switch demo user (for testing different roles)
   */
  async switchDemoUser(userIndex: number): Promise<void> {
    if (userIndex < 0 || userIndex >= this.demoUsers.length) {
      throw new Error('Invalid user index');
    }

    const demoUser = this.demoUsers[userIndex];
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

    console.log('Switched to demo user:', demoUser);
  }

  /**
   * Get available demo users
   */
  getDemoUsers(): DemoUserProfile[] {
    return [...this.demoUsers];
  }

  /**
   * Generate mock JWT token
   */
  private generateMockToken(user: DemoUserProfile): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      preferred_username: user.preferredUsername,
      roles: user.roles,
      tid: user.tenantId,
      aud: 'demo-client-id',
      iss: 'https://demo.b2clogin.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    }));
    const signature = btoa('demo-signature');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Clear authentication session
   */
  private clearSession(): void {
    localStorage.removeItem('demo:auth:user');
    localStorage.removeItem('demo:auth:token');
  }

  /**
   * Update authentication state and notify subscribers
   */
  private updateAuthState(updates: Partial<DemoAuthState>): void {
    const currentState = this.authState();
    const newState = { ...currentState, ...updates };
    
    this.authState.set(newState);
    this.authStateSubject.next(newState);
  }
}
