import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `
    <!-- MFE3 Authentication Portal -->
    <div class="auth-mfe-container">
      <!-- Header -->
      <header class="auth-header">
        <div class="container">
          <div class="d-flex align-items-center justify-content-between">
            <div class="auth-brand">
              <i class="fas fa-shield-alt me-2"></i>
              <span class="brand-text">{{ title() }}</span>
            </div>

            @if (isAuthenticated()) {
              <div class="auth-user-info">
                <span class="user-name">{{ user()?.name }}</span>
                <div class="user-avatar">
                  <i class="fas fa-user"></i>
                </div>
              </div>
            }
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="auth-main">
        @if (isLoading()) {
          <div class="loading-container">
            <div class="loading-spinner">
              <i class="fas fa-sync-alt fa-spin"></i>
            </div>
            <p>Loading authentication...</p>
          </div>
        } @else {
          <router-outlet></router-outlet>
        }
      </main>

      <!-- Footer -->
      <footer class="auth-footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-info">
              <i class="fas fa-info-circle me-2"></i>
              <span>Secure Authentication Portal for Angular Microfrontends</span>
            </div>
            <div class="footer-tech">
              <span class="tech-badge">
                <i class="fab fa-angular me-1"></i>
                Angular 20
              </span>
              <span class="tech-badge">
                <i class="fab fa-microsoft me-1"></i>
                Azure AD B2C
              </span>
              <span class="tech-badge">
                <i class="fas fa-shield-alt me-1"></i>
                MSAL
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);

  protected readonly title = signal('MFE3 Authentication Portal');
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly user = this.authService.user;
  protected readonly isLoading = this.authService.isLoading;

  ngOnInit(): void {
    console.log('MFE3 Authentication Portal initialized');
  }
}
