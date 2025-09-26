import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { demoConfig } from '../config/auth.config';

/**
 * Login Component for MFE3 Authentication
 * 
 * This component provides:
 * - Azure AD B2C login integration
 * - Demo user selection for development
 * - Responsive design with Bootstrap
 * - Loading states and error handling
 * - Accessibility features
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <div class="login-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h1 class="login-title">Authentication Portal</h1>
          <p class="login-subtitle">Secure access to microfrontend applications</p>
        </div>

        <!-- Demo Mode Banner -->
        @if (isDemoMode()) {
          <div class="alert alert-info demo-banner" role="alert">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Demo Mode:</strong> Choose a demo user or use Azure AD B2C authentication
          </div>
        }

        <!-- Error Display -->
        @if (error()) {
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error() }}
          </div>
        }

        <!-- Demo User Selection -->
        @if (isDemoMode()) {
          <div class="demo-users-section">
            <h3 class="demo-section-title">
              <i class="fas fa-users me-2"></i>
              Demo Users
            </h3>
            <div class="demo-users-grid">
              @for (user of demoUsers(); track user.id) {
                <div class="demo-user-card" 
                     (click)="loginWithDemoUser(user)"
                     [class.loading]="isLoading()"
                     role="button"
                     tabindex="0"
                     (keydown.enter)="loginWithDemoUser(user)"
                     (keydown.space)="loginWithDemoUser(user)">
                  <div class="demo-user-avatar">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="demo-user-info">
                    <h4 class="demo-user-name">{{ user.name }}</h4>
                    <p class="demo-user-email">{{ user.email }}</p>
                    <div class="demo-user-roles">
                      @for (role of user.roles; track role) {
                        <span class="badge bg-primary me-1">{{ role }}</span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="divider">
            <span class="divider-text">OR</span>
          </div>
        }

        <!-- Azure AD B2C Login -->
        <div class="azure-login-section">
          <h3 class="azure-section-title">
            <i class="fab fa-microsoft me-2"></i>
            Azure AD B2C Authentication
          </h3>
          
          <div class="azure-login-buttons">
            <button 
              type="button"
              class="btn btn-primary btn-lg azure-login-btn"
              (click)="loginWithRedirect()"
              [disabled]="isLoading()"
              aria-label="Sign in with Azure AD B2C using redirect">
              @if (isLoading()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              } @else {
                <i class="fas fa-sign-in-alt me-2"></i>
                Sign In with Redirect
              }
            </button>

            <button 
              type="button"
              class="btn btn-outline-primary btn-lg azure-login-btn"
              (click)="loginWithPopup()"
              [disabled]="isLoading()"
              aria-label="Sign in with Azure AD B2C using popup">
              @if (isLoading()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              } @else {
                <i class="fas fa-external-link-alt me-2"></i>
                Sign In with Popup
              }
            </button>
          </div>
        </div>

        <!-- Features -->
        <div class="login-features">
          <h4 class="features-title">Security Features</h4>
          <ul class="features-list">
            <li><i class="fas fa-check text-success me-2"></i>PKCE (Proof Key for Code Exchange)</li>
            <li><i class="fas fa-check text-success me-2"></i>Secure token storage</li>
            <li><i class="fas fa-check text-success me-2"></i>Cross-MFE authentication sync</li>
            <li><i class="fas fa-check text-success me-2"></i>Automatic token refresh</li>
            <li><i class="fas fa-check text-success me-2"></i>Role-based access control</li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <p class="footer-text">
            <i class="fas fa-info-circle me-1"></i>
            This is a microfrontend authentication portal powered by Angular and Azure AD B2C
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 40px;
      max-width: 600px;
      width: 100%;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: white;
      font-size: 2rem;
    }

    .login-title {
      color: #2d3748;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .login-subtitle {
      color: #718096;
      font-size: 1.1rem;
      margin-bottom: 0;
    }

    .demo-banner {
      border-left: 4px solid #3182ce;
      background-color: #ebf8ff;
      border-color: #3182ce;
    }

    .demo-users-section {
      margin-bottom: 30px;
    }

    .demo-section-title,
    .azure-section-title {
      color: #2d3748;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
    }

    .demo-users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .demo-user-card {
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f7fafc;
    }

    .demo-user-card:hover {
      border-color: #3182ce;
      background: #ebf8ff;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .demo-user-card.loading {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .demo-user-avatar {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      margin-bottom: 15px;
    }

    .demo-user-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 5px;
    }

    .demo-user-email {
      color: #718096;
      font-size: 0.9rem;
      margin-bottom: 10px;
    }

    .demo-user-roles .badge {
      font-size: 0.75rem;
    }

    .divider {
      text-align: center;
      margin: 30px 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }

    .divider-text {
      background: white;
      padding: 0 20px;
      color: #718096;
      font-weight: 500;
    }

    .azure-login-section {
      margin-bottom: 30px;
    }

    .azure-login-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .azure-login-btn {
      padding: 15px 30px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .azure-login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .login-features {
      background: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .features-title {
      color: #2d3748;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .features-list li {
      padding: 5px 0;
      color: #4a5568;
    }

    .login-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .footer-text {
      color: #718096;
      font-size: 0.9rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .login-card {
        padding: 30px 20px;
        margin: 10px;
      }

      .demo-users-grid {
        grid-template-columns: 1fr;
      }

      .azure-login-buttons {
        gap: 10px;
      }

      .azure-login-btn {
        padding: 12px 20px;
        font-size: 1rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Reactive state
  protected readonly isLoading = this.authService.isLoading;
  protected readonly error = this.authService.error;
  protected readonly isDemoMode = signal(demoConfig.enabled);
  protected readonly demoUsers = signal(demoConfig.users);

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectAfterLogin();
      return;
    }

    // Listen to authentication state changes
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.isAuthenticated && !state.isLoading) {
          this.redirectAfterLogin();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Login with Azure AD B2C using redirect flow
   */
  async loginWithRedirect(): Promise<void> {
    try {
      await this.authService.loginRedirect();
    } catch (error) {
      console.error('Login with redirect failed:', error);
    }
  }

  /**
   * Login with Azure AD B2C using popup flow
   */
  async loginWithPopup(): Promise<void> {
    try {
      await this.authService.loginPopup();
    } catch (error) {
      console.error('Login with popup failed:', error);
    }
  }

  /**
   * Login with demo user (development only)
   */
  async loginWithDemoUser(user: any): Promise<void> {
    if (!demoConfig.enabled) return;

    try {
      const userIndex = demoConfig.users.findIndex(u => u.id === user.id);
      if (userIndex >= 0) {
        await this.authService.switchDemoUser(userIndex);
        // Success will be handled by the auth state subscription
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  }

  /**
   * Redirect after successful login
   */
  private redirectAfterLogin(): void {
    // Notify parent window (shell) about successful login
    this.notifyParentWindow('AUTH_LOGIN_SUCCESS', {
      user: this.authService.user(),
      timestamp: Date.now()
    });

    // Check for return URL
    const returnUrl = sessionStorage.getItem('returnUrl') || '/dashboard';
    sessionStorage.removeItem('returnUrl');

    // If we're in an iframe (MFE context), redirect parent window
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'AUTH_REDIRECT',
        url: returnUrl
      }, window.location.origin);
    } else {
      // Direct navigation for standalone mode
      window.location.href = returnUrl.startsWith('http') ? returnUrl : `http://localhost:4200${returnUrl}`;
    }
  }

  /**
   * Notify parent window about authentication events
   */
  private notifyParentWindow(type: string, data: any): void {
    if (window.parent !== window) {
      window.parent.postMessage({
        type,
        ...data
      }, window.location.origin);
    }
  }
}
