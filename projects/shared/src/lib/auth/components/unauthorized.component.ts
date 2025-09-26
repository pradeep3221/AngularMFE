import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'lib-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <div class="error-icon">
          <i class="fas fa-shield-alt"></i>
          <i class="fas fa-times error-overlay"></i>
        </div>
        
        <h1 class="error-title">Access Denied</h1>
        <p class="error-message">
          You don't have permission to access this resource.
        </p>
        
        <div class="error-details">
          <div class="detail-item">
            <i class="fas fa-user"></i>
            <span>User: {{ user()?.name || 'Unknown' }}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-envelope"></i>
            <span>Email: {{ user()?.email || 'Not available' }}</span>
          </div>
          @if (user()?.roles && user()!.roles.length > 0) {
            <div class="detail-item">
              <i class="fas fa-tags"></i>
              <span>Roles: {{ user()!.roles.join(', ') }}</span>
            </div>
          }
        </div>
        
        <div class="error-actions">
          <button class="btn btn-primary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
            Go Back
          </button>
          
          <button class="btn btn-outline-primary" (click)="goHome()">
            <i class="fas fa-home"></i>
            Go to Dashboard
          </button>
          
          <button class="btn btn-outline-secondary" (click)="contactSupport()">
            <i class="fas fa-life-ring"></i>
            Contact Support
          </button>
        </div>
        
        <div class="help-section">
          <h3>Need Help?</h3>
          <p>If you believe you should have access to this resource:</p>
          <ul>
            <li>Contact your system administrator</li>
            <li>Check if you have the required permissions</li>
            <li>Verify your account status</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 2rem;
    }

    .unauthorized-content {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      max-width: 600px;
      width: 100%;
      text-align: center;
    }

    .error-icon {
      position: relative;
      display: inline-block;
      margin-bottom: 2rem;
    }

    .error-icon .fas {
      font-size: 4rem;
      color: #e53e3e;
    }

    .error-overlay {
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      font-size: 2rem !important;
      background: white;
      border-radius: 50%;
      padding: 0.25rem;
    }

    .error-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 1rem;
    }

    .error-message {
      font-size: 1.2rem;
      color: #718096;
      margin-bottom: 2rem;
    }

    .error-details {
      background: #f7fafc;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      color: #4a5568;
    }

    .detail-item:last-child {
      margin-bottom: 0;
    }

    .detail-item i {
      width: 16px;
      color: #667eea;
    }

    .error-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .error-actions .btn {
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .error-actions .btn:hover {
      transform: translateY(-2px);
    }

    .error-actions .btn i {
      margin-right: 0.5rem;
    }

    .help-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 2rem;
      text-align: left;
    }

    .help-section h3 {
      color: #2d3748;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    .help-section p {
      color: #718096;
      margin-bottom: 1rem;
    }

    .help-section ul {
      color: #4a5568;
      padding-left: 1.5rem;
    }

    .help-section li {
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .unauthorized-container {
        padding: 1rem;
      }
      
      .unauthorized-content {
        padding: 2rem;
      }
      
      .error-title {
        font-size: 2rem;
      }
      
      .error-actions {
        flex-direction: column;
      }
      
      .error-actions .btn {
        width: 100%;
      }
    }

    @media (max-width: 576px) {
      .error-icon .fas {
        font-size: 3rem;
      }
      
      .error-title {
        font-size: 1.75rem;
      }
      
      .error-message {
        font-size: 1rem;
      }
    }
  `]
})
export class UnauthorizedComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;

  /**
   * Go back to previous page
   */
  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.goHome();
    }
  }

  /**
   * Navigate to dashboard/home
   */
  goHome(): void {
    this.router.navigate(['/dashboard']).catch(error => {
      console.error('Navigation to dashboard failed:', error);
      this.router.navigate(['/']);
    });
  }

  /**
   * Contact support (placeholder)
   */
  contactSupport(): void {
    // In a real application, this might:
    // - Open a support ticket modal
    // - Navigate to a contact form
    // - Open email client
    // - Redirect to help desk
    
    const supportEmail = 'support@yourcompany.com';
    const subject = encodeURIComponent('Access Request - Unauthorized Access');
    const body = encodeURIComponent(`
Hello Support Team,

I encountered an "Access Denied" error while trying to access a resource in the application.

User Details:
- Name: ${this.user()?.name || 'Unknown'}
- Email: ${this.user()?.email || 'Not available'}
- Roles: ${this.user()?.roles?.join(', ') || 'None'}
- Timestamp: ${new Date().toISOString()}
- URL: ${window.location.href}

Please review my access permissions and provide assistance.

Thank you,
${this.user()?.name || 'User'}
    `);

    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  }
}
