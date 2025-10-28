import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PwaService } from 'shared';

@Component({
  selector: 'app-offline-fallback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="offline-container">
      <div class="offline-content">
        <div class="offline-icon">
          <i class="fas fa-wifi-off"></i>
        </div>
        <h1>Offline Mode</h1>
        <p class="offline-message">
          You are currently offline, but don't worry! You can still access cached content and features.
        </p>

        <div class="offline-features">
          <h2>Available Features</h2>
          <ul>
            <li>
              <i class="fas fa-check-circle"></i>
              <span>View cached pages and data</span>
            </li>
            <li>
              <i class="fas fa-check-circle"></i>
              <span>Access previously loaded components</span>
            </li>
            <li>
              <i class="fas fa-check-circle"></i>
              <span>Browse navigation menus</span>
            </li>
            <li>
              <i class="fas fa-times-circle"></i>
              <span>Limited API functionality (will sync when online)</span>
            </li>
          </ul>
        </div>

        <div class="offline-actions">
          <button (click)="tryAgain()" class="btn btn-primary btn-lg">
            <i class="fas fa-sync-alt me-2"></i>
            Try to Reconnect
          </button>
          <button routerLink="/" class="btn btn-secondary btn-lg">
            <i class="fas fa-home me-2"></i>
            Go to Home
          </button>
        </div>

        <div class="offline-info">
          <p>
            <strong>Status:</strong>
            @if (isOnline()) {
              <span class="badge bg-success">
                <i class="fas fa-check me-1"></i>
                Online
              </span>
            } @else {
              <span class="badge bg-danger">
                <i class="fas fa-times me-1"></i>
                Offline
              </span>
            }
          </p>
          <p class="text-muted small">
            Connection will be restored automatically when your internet returns.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .offline-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 600px;
      text-align: center;
      animation: slideUp 0.5s ease-out;
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

    .offline-icon {
      font-size: 80px;
      color: #667eea;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 32px;
    }

    .offline-message {
      color: #666;
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .offline-features {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      text-align: left;
    }

    .offline-features h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 15px;
      text-align: center;
    }

    .offline-features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .offline-features li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      color: #555;
      font-size: 14px;
    }

    .offline-features i.fa-check-circle {
      color: #28a745;
      font-size: 16px;
      flex-shrink: 0;
    }

    .offline-features i.fa-times-circle {
      color: #dc3545;
      font-size: 16px;
      flex-shrink: 0;
    }

    .offline-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: #e9ecef;
      color: #333;
    }

    .btn-secondary:hover {
      background: #dee2e6;
      transform: translateY(-2px);
    }

    .offline-info {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .offline-info p {
      margin: 10px 0;
      color: #666;
      font-size: 14px;
    }

    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .text-muted {
      color: #999 !important;
    }

    @media (max-width: 600px) {
      .offline-content {
        padding: 30px 20px;
      }

      .offline-icon {
        font-size: 60px;
      }

      h1 {
        font-size: 24px;
      }

      .btn-lg {
        padding: 10px 16px;
        font-size: 13px;
      }

      .offline-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class OfflineFallbackComponent implements OnInit {
  protected pwaService = inject(PwaService);
  protected isOnline = this.pwaService.isOnline;

  ngOnInit(): void {
    console.log('[OfflineFallback] Component initialized');
    console.log('[OfflineFallback] Current PWA state:', this.pwaService.getState());
  }

  /**
   * Try to reconnect to the server
   */
  async tryAgain(): Promise<void> {
    try {
      // Check if connection is restored
      const response = await fetch('/health', {
        method: 'GET',
        cache: 'no-store'
      });

      if (response.ok) {
        console.log('[OfflineFallback] Connection restored');
        // Reload the page
        window.location.reload();
      }
    } catch (error) {
      console.log('[OfflineFallback] Still offline:', error);
      // Stay on offline page
    }
  }
}
