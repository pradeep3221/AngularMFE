import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfileComponent, PwaService } from 'shared';
import { UpdateAvailableComponent } from './components/update-available.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, UserProfileComponent, UpdateAvailableComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly pwaService = inject(PwaService);
  private subscriptions = new Subscription();

  protected readonly title = signal('shell');

  // Reactive authentication state
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly user = this.authService.user;
  protected readonly isLoading = this.authService.isLoading;

  ngOnInit(): void {
    // Initialize PWA service
    this.initializePWA();

    // Initialize cross-MFE authentication communication
    this.setupCrossMFECommunication();

    // Listen for authentication state changes
    this.subscriptions.add(
      this.authService.authState$.subscribe(state => {
        console.log('Shell: Authentication state changed', state);

        // Redirect to dashboard after successful login
        if (state.isAuthenticated && !state.isLoading) {
          const currentUrl = this.router.url;
          if (currentUrl === '/' || currentUrl === '/login' || currentUrl === '/auth/login') {
            this.router.navigate(['/dashboard']);
          }
        }
      })
    );

    console.log('Shell application initialized with authentication');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize PWA functionality
   */
  private initializePWA(): void {
    console.log('[Shell] Initializing PWA');

    // Listen for app visibility changes to check for updates
    document.addEventListener('visibilitychange', () => {
      this.pwaService.handleVisibilityChange();
    });

    // Log current PWA state
    const pwaState = this.pwaService.getState();
    console.log('[Shell] PWA State:', pwaState);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Setup cross-MFE communication for authentication
   */
  private setupCrossMFECommunication(): void {
    // Listen for authentication events from MFEs
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;

      switch (event.data.type) {
        case 'AUTH_LOGIN_SUCCESS':
          console.log('Shell: Received login success from MFE', event.data);
          // Refresh authentication state by triggering a state check
          window.location.reload(); // Simple approach to refresh auth state
          break;

        case 'AUTH_LOGOUT':
          console.log('Shell: Received logout from MFE', event.data);
          // Handle logout
          this.handleLogout();
          break;

        case 'AUTH_REDIRECT':
          console.log('Shell: Received redirect request from MFE', event.data);
          // Navigate to the requested URL
          this.router.navigate([event.data.url]);
          break;

        case 'AUTH_STATE_REQUEST':
          // Send current auth state to requesting MFE
          this.sendAuthStateToMFE(event.source, event.origin);
          break;
      }
    });
  }

  /**
   * Send authentication state to requesting MFE
   */
  private sendAuthStateToMFE(source: any, origin: string): void {
    const authState = {
      type: 'AUTH_STATE_RESPONSE',
      isAuthenticated: this.isAuthenticated(),
      user: this.user(),
      timestamp: Date.now()
    };

    source?.postMessage(authState, origin);
  }

  /**
   * Initiate login flow - redirect to authentication MFE
   */
  async login(): Promise<void> {
    try {
      // Store current URL for redirect after login
      const returnUrl = this.router.url;
      if (returnUrl !== '/login' && returnUrl !== '/') {
        sessionStorage.setItem('returnUrl', returnUrl);
      }

      // Navigate to authentication MFE
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Login navigation failed:', error);
    }
  }

  /**
   * Handle logout from any MFE
   */
  private async handleLogout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
