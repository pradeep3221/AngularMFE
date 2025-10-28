import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from 'shared';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-update-available',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Update Available Banner -->
    @if (showUpdateBanner()) {
      <div class="banner update-banner" role="alert">
        <div class="banner-content">
          <div class="banner-icon">
            <i class="fas fa-sync-alt"></i>
          </div>
          <div class="banner-message">
            <strong>Update Available</strong>
            <p>A new version of the application is available. Update now to get the latest features and fixes.</p>
          </div>
        </div>
        <div class="banner-actions">
          <button 
            type="button"
            class="btn btn-primary btn-sm"
            (click)="updateNow()"
            [disabled]="isUpdating()">
            @if (isUpdating()) {
              <i class="fas fa-spinner fa-spin me-2"></i>
              <span>Updating...</span>
            } @else {
              <i class="fas fa-download me-2"></i>
              <span>Update Now</span>
            }
          </button>
          <button 
            type="button"
            class="btn btn-secondary btn-sm"
            (click)="dismissUpdate()">
            <i class="fas fa-times me-2"></i>
            <span>Later</span>
          </button>
        </div>
      </div>
    }

    <!-- Offline Status Banner -->
    @if (!isOnline()) {
      <div class="banner offline-banner" role="alert">
        <div class="banner-content">
          <div class="banner-icon">
            <i class="fas fa-wifi-off"></i>
          </div>
          <div class="banner-message">
            <strong>Offline Mode</strong>
            <p>You are currently offline. Some features may be limited. Cached content will be used.</p>
          </div>
        </div>
      </div>
    }

    <!-- Online Status Restored Banner -->
    @if (showOnlineRestored()) {
      <div class="banner online-restored-banner" role="alert">
        <div class="banner-content">
          <div class="banner-icon">
            <i class="fas fa-wifi"></i>
          </div>
          <div class="banner-message">
            <strong>Back Online</strong>
            <p>Your connection has been restored.</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .banner-content {
      display: flex;
      align-items: flex-start;
      flex: 1;
      gap: 12px;
    }

    .banner-icon {
      font-size: 20px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .banner-message {
      margin: 0;
    }

    .banner-message strong {
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .banner-message p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .banner-actions {
      display: flex;
      gap: 8px;
      margin-left: 16px;
      flex-shrink: 0;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: white;
      color: #667eea;
    }

    .btn-primary:hover:not(:disabled) {
      background: #f0f0f0;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: inherit;
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #218838;
    }

    /* Banner variations */
    .update-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .install-banner {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .offline-banner {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .online-restored-banner {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .banner {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }

      .banner-content {
        flex-direction: column;
        width: 100%;
      }

      .banner-actions {
        margin-left: 0;
        width: 100%;
        justify-content: center;
      }

      .btn {
        flex: 1;
        justify-content: center;
      }
    }

    i.fa-spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class UpdateAvailableComponent implements OnInit, OnDestroy {
  protected pwaService = inject(PwaService);

  // Signal for showing update banner
  protected showUpdateBanner = signal(false);
  protected isUpdating = signal(false);

  // Signal for showing online restored banner
  protected showOnlineRestored = signal(false);

  protected isOnline = this.pwaService.isOnline;

  private subscriptions = new Subscription();
  private wasOffline = false;

  ngOnInit(): void {
    this.setupUpdateListener();
    this.setupInstallPromptListener();
    this.setupOnlineStatusListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Setup listener for update available events
   */
  private setupUpdateListener(): void {
    this.subscriptions.add(
      this.pwaService.getUpdateAvailable().subscribe(() => {
        console.log('[UpdateAvailable] Update available signal received');
        this.showUpdateBanner.set(true);
      })
    );

    // Also check initial state
    if (this.pwaService.hasUpdate()) {
      this.showUpdateBanner.set(true);
    }
  }

  /**
   * Setup listener for install prompt events
   */
  private setupInstallPromptListener(): void {
    // Install prompts are handled by the browser address bar
    // No banner needed
  }

  /**
   * Setup listener for online/offline status changes
   */
  private setupOnlineStatusListener(): void {
    this.subscriptions.add(
      this.pwaService.getOnlineStatus().subscribe(isOnline => {
        console.log('[UpdateAvailable] Online status changed:', isOnline);

        if (!isOnline) {
          this.wasOffline = true;
        } else if (isOnline && this.wasOffline) {
          // Show online restored banner
          this.showOnlineRestored.set(true);

          // Hide after 3 seconds
          setTimeout(() => {
            this.showOnlineRestored.set(false);
          }, 3000);

          this.wasOffline = false;
        }
      })
    );
  }

  /**
   * Trigger app update
   */
  async updateNow(): Promise<void> {
    this.isUpdating.set(true);
    try {
      await this.pwaService.updateNow();
    } catch (error) {
      console.error('[UpdateAvailable] Error updating app:', error);
      this.isUpdating.set(false);
    }
  }

  /**
   * Dismiss update banner
   */
  dismissUpdate(): void {
    this.showUpdateBanner.set(false);
  }
}
