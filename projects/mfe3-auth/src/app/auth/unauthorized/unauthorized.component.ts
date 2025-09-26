import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Unauthorized Component for MFE3 Authentication
 * 
 * This component is displayed when a user tries to access a resource
 * they don't have permission for.
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <div class="unauthorized-icon">
          <i class="fas fa-ban"></i>
        </div>
        
        <h1 class="unauthorized-title">Access Denied</h1>
        
        <p class="unauthorized-message">
          You don't have permission to access this resource. 
          Please contact your administrator if you believe this is an error.
        </p>

        <div class="user-info" *ngIf="user()">
          <h3>Current User Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <strong>Name:</strong> {{ user()?.name }}
            </div>
            <div class="info-item">
              <strong>Email:</strong> {{ user()?.email }}
            </div>
            <div class="info-item">
              <strong>Roles:</strong> 
              <span class="roles">
                @for (role of user()?.roles; track role) {
                  <span class="badge bg-secondary me-1">{{ role }}</span>
                }
              </span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button 
            type="button" 
            class="btn btn-primary"
            (click)="goHome()">
            <i class="fas fa-home me-2"></i>
            Go to Home
          </button>
          
          <button 
            type="button" 
            class="btn btn-outline-secondary"
            (click)="goBack()">
            <i class="fas fa-arrow-left me-2"></i>
            Go Back
          </button>
          
          <button 
            type="button" 
            class="btn btn-outline-danger"
            (click)="logout()">
            <i class="fas fa-sign-out-alt me-2"></i>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .unauthorized-card {
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

    .unauthorized-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: white;
      font-size: 2.5rem;
    }

    .unauthorized-title {
      color: #2d3748;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .unauthorized-message {
      color: #718096;
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .user-info {
      background: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: left;
    }

    .user-info h3 {
      color: #2d3748;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 15px;
      text-align: center;
    }

    .info-grid {
      display: grid;
      gap: 10px;
    }

    .info-item {
      color: #4a5568;
    }

    .info-item strong {
      color: #2d3748;
    }

    .roles {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-left: 8px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-buttons .btn {
      padding: 12px 24px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .action-buttons .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    @media (min-width: 576px) {
      .action-buttons {
        flex-direction: row;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .unauthorized-card {
        padding: 30px 20px;
        margin: 10px;
      }

      .unauthorized-title {
        font-size: 1.5rem;
      }

      .unauthorized-message {
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
   * Navigate to home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    window.history.back();
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
