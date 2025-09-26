import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { UserProfile } from '../auth.module';
import { demoConfig } from '../config/auth.config';

/**
 * User Profile Component for MFE3 Authentication
 * 
 * This component provides:
 * - User profile display with avatar and details
 * - Role and permission management
 * - Demo user switching (development)
 * - Logout functionality
 * - Responsive design with Bootstrap
 */
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-profile-container">
      <div class="profile-card">
        <!-- Header -->
        <div class="profile-header">
          <div class="profile-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ user()?.name || 'Unknown User' }}</h1>
            <p class="profile-email">{{ user()?.email || 'No email' }}</p>
            <p class="profile-id">ID: {{ user()?.id || 'N/A' }}</p>
          </div>
        </div>

        <!-- User Details -->
        <div class="profile-details">
          <div class="detail-section">
            <h3 class="section-title">
              <i class="fas fa-user-tag me-2"></i>
              Roles
            </h3>
            <div class="roles-container">
              @if (user()?.roles && user()!.roles.length > 0) {
                @for (role of user()!.roles; track role) {
                  <span class="badge bg-primary role-badge">
                    <i class="fas fa-shield-alt me-1"></i>
                    {{ role | titlecase }}
                  </span>
                }
              } @else {
                <span class="text-muted">No roles assigned</span>
              }
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">
              <i class="fas fa-key me-2"></i>
              Permissions
            </h3>
            <div class="permissions-container">
              @if (user()?.permissions && user()!.permissions.length > 0) {
                @for (permission of user()!.permissions; track permission) {
                  <span class="badge bg-success permission-badge">
                    <i class="fas fa-check me-1"></i>
                    {{ permission | titlecase }}
                  </span>
                }
              } @else {
                <span class="text-muted">No permissions assigned</span>
              }
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">
              <i class="fas fa-building me-2"></i>
              Tenant Information
            </h3>
            <div class="tenant-info">
              <p><strong>Tenant ID:</strong> {{ user()?.tenantId || 'N/A' }}</p>
              <p><strong>Username:</strong> {{ user()?.preferredUsername || user()?.email || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Demo User Switching -->
        @if (isDemoMode()) {
          <div class="demo-section">
            <h3 class="section-title">
              <i class="fas fa-users me-2"></i>
              Demo User Switching
            </h3>
            <p class="demo-description">
              Switch between different demo users to test various roles and permissions.
            </p>
            <div class="demo-users-grid">
              @for (demoUser of demoUsers(); track demoUser.id) {
                <div class="demo-user-card" 
                     [class.active]="demoUser.id === user()?.id"
                     (click)="switchDemoUser(demoUser)"
                     role="button"
                     tabindex="0"
                     (keydown.enter)="switchDemoUser(demoUser)"
                     (keydown.space)="switchDemoUser(demoUser)">
                  <div class="demo-user-avatar">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="demo-user-info">
                    <h4 class="demo-user-name">{{ demoUser.name }}</h4>
                    <p class="demo-user-email">{{ demoUser.email }}</p>
                    <div class="demo-user-roles">
                      @for (role of demoUser.roles; track role) {
                        <span class="badge bg-outline-primary">{{ role }}</span>
                      }
                    </div>
                  </div>
                  @if (demoUser.id === user()?.id) {
                    <div class="active-indicator">
                      <i class="fas fa-check-circle"></i>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Actions -->
        <div class="profile-actions">
          <button 
            type="button"
            class="btn btn-outline-secondary"
            (click)="refreshProfile()"
            [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Refreshing...
            } @else {
              <i class="fas fa-sync-alt me-2"></i>
              Refresh Profile
            }
          </button>

          <button 
            type="button"
            class="btn btn-danger"
            (click)="logout()"
            [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Signing out...
            } @else {
              <i class="fas fa-sign-out-alt me-2"></i>
              Sign Out
            }
          </button>
        </div>

        <!-- Security Info -->
        <div class="security-info">
          <h4 class="security-title">
            <i class="fas fa-shield-alt me-2"></i>
            Security Information
          </h4>
          <ul class="security-list">
            <li><i class="fas fa-check text-success me-2"></i>Secure authentication with Azure AD B2C</li>
            <li><i class="fas fa-check text-success me-2"></i>Token-based authorization</li>
            <li><i class="fas fa-check text-success me-2"></i>Cross-MFE authentication sync</li>
            <li><i class="fas fa-check text-success me-2"></i>Automatic session management</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-profile-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
    }

    .profile-card {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
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

    .profile-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      display: flex;
      align-items: center;
      gap: 30px;
    }

    .profile-avatar {
      width: 100px;
      height: 100px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      backdrop-filter: blur(10px);
    }

    .profile-info h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .profile-info p {
      margin-bottom: 4px;
      opacity: 0.9;
    }

    .profile-details {
      padding: 40px;
    }

    .detail-section {
      margin-bottom: 30px;
    }

    .section-title {
      color: #2d3748;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }

    .roles-container,
    .permissions-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .role-badge,
    .permission-badge {
      font-size: 0.875rem;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .tenant-info p {
      margin-bottom: 8px;
      color: #4a5568;
    }

    .demo-section {
      background: #f7fafc;
      padding: 30px;
      margin: 0 -40px 30px;
    }

    .demo-description {
      color: #718096;
      margin-bottom: 20px;
    }

    .demo-users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .demo-user-card {
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: white;
      position: relative;
    }

    .demo-user-card:hover {
      border-color: #3182ce;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .demo-user-card.active {
      border-color: #38a169;
      background: #f0fff4;
    }

    .demo-user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 10px;
    }

    .demo-user-name {
      font-size: 1rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 4px;
    }

    .demo-user-email {
      color: #718096;
      font-size: 0.875rem;
      margin-bottom: 8px;
    }

    .demo-user-roles .badge {
      font-size: 0.75rem;
      margin-right: 4px;
    }

    .active-indicator {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #38a169;
      font-size: 1.25rem;
    }

    .profile-actions {
      padding: 0 40px 30px;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .profile-actions .btn {
      padding: 12px 24px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .profile-actions .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .security-info {
      background: #f7fafc;
      padding: 30px 40px;
      margin-top: 20px;
    }

    .security-title {
      color: #2d3748;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .security-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .security-list li {
      padding: 5px 0;
      color: #4a5568;
    }

    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
        padding: 30px 20px;
      }

      .profile-details {
        padding: 30px 20px;
      }

      .demo-section {
        margin: 0 -20px 20px;
        padding: 20px;
      }

      .demo-users-grid {
        grid-template-columns: 1fr;
      }

      .profile-actions {
        padding: 0 20px 20px;
        flex-direction: column;
      }

      .security-info {
        padding: 20px;
      }
    }
  `]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  // Reactive state
  protected readonly user = this.authService.user;
  protected readonly isLoading = this.authService.isLoading;
  protected readonly isDemoMode = signal(demoConfig.enabled);
  protected readonly demoUsers = signal(demoConfig.users);

  ngOnInit(): void {
    // Listen to authentication state changes
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (!state.isAuthenticated) {
          // Redirect to login if not authenticated
          window.location.href = '/auth/login';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Refresh user profile
   */
  async refreshProfile(): Promise<void> {
    try {
      // In a real application, this would fetch fresh user data
      console.log('Refreshing user profile...');
      
      // For demo purposes, just log the current user
      console.log('Current user:', this.user());
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }

  /**
   * Switch to a different demo user
   */
  async switchDemoUser(demoUser: any): Promise<void> {
    if (!demoConfig.enabled) return;

    try {
      const userIndex = demoConfig.users.findIndex(u => u.id === demoUser.id);
      if (userIndex >= 0) {
        await this.authService.switchDemoUser(userIndex);
      }
    } catch (error) {
      console.error('Failed to switch demo user:', error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Show confirmation dialog
      if (confirm('Are you sure you want to sign out?')) {
        // Notify parent window about logout
        this.notifyParentWindow('AUTH_LOGOUT', {
          timestamp: Date.now()
        });

        // Perform logout
        await this.authService.logout();

        // Redirect to shell home page
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'AUTH_REDIRECT',
            url: '/'
          }, window.location.origin);
        } else {
          window.location.href = 'http://localhost:4200/';
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
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
