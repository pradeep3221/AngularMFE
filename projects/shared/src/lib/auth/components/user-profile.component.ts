import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '../auth.service';

@Component({
  selector: 'lib-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-profile-dropdown">
      <button 
        class="btn btn-link user-profile-btn"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false">
        <div class="user-avatar">
          @if (user()?.name) {
            {{ getInitials(user()!.name) }}
          } @else {
            <i class="fas fa-user"></i>
          }
        </div>
        <span class="user-name d-none d-md-inline">{{ user()?.name || 'User' }}</span>
        <i class="fas fa-chevron-down ms-1"></i>
      </button>

      <ul class="dropdown-menu dropdown-menu-end user-dropdown">
        <li class="dropdown-header">
          <div class="user-info">
            <div class="user-avatar-large">
              @if (user()?.name) {
                {{ getInitials(user()!.name) }}
              } @else {
                <i class="fas fa-user"></i>
              }
            </div>
            <div class="user-details">
              <div class="user-name-large">{{ user()?.name || 'Unknown User' }}</div>
              <div class="user-email">{{ user()?.email || 'No email' }}</div>
              @if (user()?.roles && user()!.roles.length > 0) {
                <div class="user-roles">
                  @for (role of user()!.roles; track role) {
                    <span class="badge bg-primary me-1">{{ role }}</span>
                  }
                </div>
              }
            </div>
          </div>
        </li>
        
        <li><hr class="dropdown-divider"></li>
        
        <li>
          <a class="dropdown-item" href="#" (click)="viewProfile($event)">
            <i class="fas fa-user-circle me-2"></i>
            View Profile
          </a>
        </li>
        
        <li>
          <a class="dropdown-item" href="#" (click)="accountSettings($event)">
            <i class="fas fa-cog me-2"></i>
            Account Settings
          </a>
        </li>
        
        <li>
          <a class="dropdown-item" href="#" (click)="securitySettings($event)">
            <i class="fas fa-shield-alt me-2"></i>
            Security
          </a>
        </li>
        
        <li><hr class="dropdown-divider"></li>
        
        <li>
          <a class="dropdown-item" href="#" (click)="help($event)">
            <i class="fas fa-question-circle me-2"></i>
            Help & Support
          </a>
        </li>
        
        <li><hr class="dropdown-divider"></li>
        
        <li>
          <button class="dropdown-item text-danger" (click)="logout()">
            <i class="fas fa-sign-out-alt me-2"></i>
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .user-profile-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      color: inherit;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .user-profile-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 500;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-dropdown {
      min-width: 280px;
      border: none;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      padding: 0;
      margin-top: 0.5rem;
    }

    .dropdown-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
      border-bottom: none;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar-large {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name-large {
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-email {
      font-size: 0.85rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-roles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .user-roles .badge {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      background: rgba(255, 255, 255, 0.2) !important;
    }

    .dropdown-item {
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }

    .dropdown-item:hover {
      background-color: #f8f9fa;
      color: #495057;
    }

    .dropdown-item.text-danger:hover {
      background-color: #f8d7da;
      color: #721c24;
    }

    .dropdown-item i {
      width: 16px;
      text-align: center;
      opacity: 0.7;
    }

    .dropdown-divider {
      margin: 0.5rem 0;
      opacity: 0.1;
    }

    @media (max-width: 768px) {
      .user-dropdown {
        min-width: 260px;
      }
      
      .dropdown-header {
        padding: 1rem;
      }
      
      .user-info {
        gap: 0.75rem;
      }
      
      .user-avatar-large {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }
    }
  `]
})
export class UserProfileComponent {
  private readonly authService = inject(AuthService);

  protected readonly user = this.authService.user;

  /**
   * Get user initials for avatar
   */
  getInitials(name: string): string {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * View user profile
   */
  viewProfile(event: Event): void {
    event.preventDefault();
    // Navigate to authentication MFE profile page
    this.navigateToAuthMFE('/profile');
  }

  /**
   * Open account settings
   */
  accountSettings(event: Event): void {
    event.preventDefault();
    // Navigate to authentication MFE settings
    this.navigateToAuthMFE('/settings/account');
  }

  /**
   * Open security settings
   */
  securitySettings(event: Event): void {
    event.preventDefault();
    // Navigate to authentication MFE security settings
    this.navigateToAuthMFE('/settings/security');
  }

  /**
   * Open help and support
   */
  help(event: Event): void {
    event.preventDefault();
    // Navigate to help page
    this.navigateToAuthMFE('/help');
  }

  /**
   * Sign out user
   */
  async logout(): Promise<void> {
    try {
      // Show confirmation dialog
      if (confirm('Are you sure you want to sign out?')) {
        // Notify other MFEs about logout
        this.notifyLogout();

        // Perform logout
        await this.authService.logout();

        // Redirect to home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  }

  /**
   * Navigate to authentication MFE
   */
  private navigateToAuthMFE(path: string): void {
    const authMfeUrl = `http://localhost:4203${path}`;

    // If we're in the shell, navigate within the shell
    if (window.location.port === '4200') {
      window.location.href = `/auth${path}`;
    } else {
      // Open in new tab for other MFEs
      window.open(authMfeUrl, '_blank');
    }
  }

  /**
   * Notify other MFEs about logout
   */
  private notifyLogout(): void {
    // Broadcast logout event to all MFEs
    window.postMessage({
      type: 'AUTH_LOGOUT',
      timestamp: Date.now()
    }, window.location.origin);

    // Also notify parent window if in iframe
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'AUTH_LOGOUT',
        timestamp: Date.now()
      }, window.location.origin);
    }
  }
}
