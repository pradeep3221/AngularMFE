import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <i class="fas fa-shield-alt login-icon"></i>
          <h1 class="login-title">Secure Login</h1>
          <p class="login-subtitle">Sign in to access your microfrontend applications</p>
        </div>

        <div class="login-content">
          @if (authState().isLoading) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Authenticating...</p>
            </div>
          } @else if (authState().error) {
            <div class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
              <p>{{ authState().error }}</p>
              <button class="btn btn-outline-primary" (click)="retry()">
                <i class="fas fa-redo"></i>
                Try Again
              </button>
            </div>
          } @else {
            <div class="login-actions">
              <button 
                class="btn btn-primary btn-lg login-btn"
                (click)="login()"
                [disabled]="authState().isLoading">
                <i class="fas fa-sign-in-alt"></i>
                Sign In with Azure AD B2C
              </button>
              
              <div class="login-features">
                <div class="feature">
                  <i class="fas fa-lock"></i>
                  <span>Secure Authentication</span>
                </div>
                <div class="feature">
                  <i class="fas fa-users"></i>
                  <span>Single Sign-On</span>
                </div>
                <div class="feature">
                  <i class="fas fa-shield-check"></i>
                  <span>Multi-Factor Authentication</span>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="login-footer">
          <p class="text-muted">
            <i class="fas fa-info-circle"></i>
            Your session will be secured with industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }

    .login-header {
      margin-bottom: 2rem;
    }

    .login-icon {
      font-size: 3rem;
      color: #667eea;
      margin-bottom: 1rem;
    }

    .login-title {
      font-size: 2rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    .login-subtitle {
      color: #718096;
      font-size: 1.1rem;
      margin-bottom: 0;
    }

    .login-content {
      margin-bottom: 2rem;
    }

    .loading-state {
      padding: 2rem 0;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-state {
      padding: 2rem 0;
      color: #e53e3e;
    }

    .error-state i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .login-btn {
      width: 100%;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      margin-bottom: 2rem;
      transition: all 0.3s ease;
    }

    .login-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .login-btn i {
      margin-right: 0.5rem;
    }

    .login-features {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .feature {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #4a5568;
      font-size: 0.9rem;
    }

    .feature i {
      color: #667eea;
      width: 16px;
    }

    .login-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 1.5rem;
      font-size: 0.85rem;
    }

    .login-footer i {
      margin-right: 0.5rem;
      color: #667eea;
    }

    @media (max-width: 576px) {
      .login-container {
        padding: 1rem;
      }
      
      .login-card {
        padding: 2rem;
      }
      
      .login-title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly authState = this.authService.authState;

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectToReturnUrl();
    }

    // Listen for authentication state changes
    this.authService.authState$.subscribe(state => {
      if (state.isAuthenticated) {
        this.redirectToReturnUrl();
      }
    });
  }

  /**
   * Initiate login flow
   */
  async login(): Promise<void> {
    try {
      await this.authService.loginRedirect();
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  /**
   * Retry authentication after error
   */
  retry(): void {
    window.location.reload();
  }

  /**
   * Redirect to the originally requested URL or dashboard
   */
  private redirectToReturnUrl(): void {
    const returnUrl = sessionStorage.getItem('auth:returnUrl') || '/dashboard';
    sessionStorage.removeItem('auth:returnUrl');
    
    this.router.navigate([returnUrl]).catch(error => {
      console.error('Navigation failed:', error);
      this.router.navigate(['/dashboard']);
    });
  }
}
