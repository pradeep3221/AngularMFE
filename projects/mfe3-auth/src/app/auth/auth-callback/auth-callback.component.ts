import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

/**
 * Authentication Callback Component for MFE3
 * 
 * This component handles the redirect callback from Azure AD B2C
 * and processes the authentication result.
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        <div class="callback-icon">
          <i class="fas fa-sync-alt fa-spin"></i>
        </div>
        
        <h1 class="callback-title">Processing Authentication</h1>
        
        <p class="callback-message">
          Please wait while we complete your sign-in process...
        </p>

        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>

        <div class="callback-steps">
          <div class="step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
            <i class="fas fa-check-circle"></i>
            <span>Validating credentials</span>
          </div>
          <div class="step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
            <i class="fas fa-user-check"></i>
            <span>Loading user profile</span>
          </div>
          <div class="step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
            <i class="fas fa-key"></i>
            <span>Setting up session</span>
          </div>
          <div class="step" [class.active]="currentStep >= 4">
            <i class="fas fa-home"></i>
            <span>Redirecting to application</span>
          </div>
        </div>

        @if (error) {
          <div class="error-section">
            <div class="error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Authentication Failed</h3>
            <p>{{ error }}</p>
            <button 
              type="button" 
              class="btn btn-primary"
              (click)="retryAuthentication()">
              <i class="fas fa-redo me-2"></i>
              Try Again
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .callback-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
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

    .callback-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: white;
      font-size: 2.5rem;
    }

    .callback-title {
      color: #2d3748;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .callback-message {
      color: #718096;
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      margin-bottom: 30px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
      animation: progress 3s ease-in-out infinite;
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }

    .callback-steps {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 30px;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background: #f7fafc;
      transition: all 0.3s ease;
      opacity: 0.5;
    }

    .step.active {
      opacity: 1;
      background: #ebf8ff;
      border-left: 4px solid #3182ce;
    }

    .step.completed {
      opacity: 1;
      background: #f0fff4;
      border-left: 4px solid #38a169;
    }

    .step.completed i {
      color: #38a169;
    }

    .step.active:not(.completed) i {
      color: #3182ce;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .step span {
      color: #4a5568;
      font-weight: 500;
    }

    .error-section {
      background: #fed7d7;
      border: 1px solid #feb2b2;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }

    .error-icon {
      width: 50px;
      height: 50px;
      background: #e53e3e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
      color: white;
      font-size: 1.5rem;
    }

    .error-section h3 {
      color: #742a2a;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .error-section p {
      color: #742a2a;
      margin-bottom: 15px;
    }

    .error-section .btn {
      background: #e53e3e;
      border-color: #e53e3e;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .error-section .btn:hover {
      background: #c53030;
      border-color: #c53030;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 768px) {
      .callback-card {
        padding: 30px 20px;
        margin: 10px;
      }

      .callback-title {
        font-size: 1.5rem;
      }

      .callback-message {
        font-size: 1rem;
      }

      .step {
        padding: 10px;
      }
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected currentStep = 1;
  protected error: string | null = null;

  ngOnInit(): void {
    this.processAuthenticationCallback();
  }

  /**
   * Process the authentication callback
   */
  private async processAuthenticationCallback(): Promise<void> {
    try {
      // Step 1: Validating credentials
      this.currentStep = 1;
      await this.delay(800);

      // Step 2: Loading user profile
      this.currentStep = 2;
      await this.delay(800);

      // Step 3: Setting up session
      this.currentStep = 3;
      await this.delay(800);

      // Step 4: Redirecting to application
      this.currentStep = 4;
      await this.delay(500);

      // Check if user is now authenticated
      if (this.authService.isAuthenticated()) {
        // Get the return URL or default to home
        const returnUrl = AuthGuard.getAndClearReturnUrl() || '/';
        this.router.navigate([returnUrl]);
      } else {
        throw new Error('Authentication was not successful');
      }

    } catch (error) {
      console.error('Authentication callback processing failed:', error);
      this.error = error instanceof Error ? error.message : 'Authentication failed';
    }
  }

  /**
   * Retry authentication
   */
  retryAuthentication(): void {
    this.error = null;
    this.currentStep = 1;
    this.router.navigate(['/auth/login']);
  }

  /**
   * Utility method to add delays for better UX
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
