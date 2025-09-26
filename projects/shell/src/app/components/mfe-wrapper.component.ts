import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-mfe-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mfe-container">
      <div class="mfe-header">
        <h2>{{ title }}</h2>
        <div class="mfe-info">
          <span class="mfe-badge">Microfrontend</span>
          <span class="mfe-url">{{ mfeUrl }}</span>
        </div>
      </div>
      
      <div class="mfe-content">
        <div class="loading-overlay" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>Loading {{ title }}...</p>
        </div>
        
        <iframe 
          [src]="safeMfeUrl" 
          class="mfe-iframe"
          (load)="onIframeLoad()"
          frameborder="0"
          width="100%" 
          height="100%">
        </iframe>
      </div>
      
      <div class="mfe-footer">
        <small>This content is loaded from: {{ mfeUrl }}</small>
      </div>
    </div>
  `,
  styles: [`
    .mfe-container {
      height: calc(100vh - 56px - 1rem); /* Full height minus navbar and padding */
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
      overflow: hidden;
      border-radius: 0.375rem;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    
    .mfe-header {
      background: white;
      padding: 15px 20px;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .mfe-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5em;
    }
    
    .mfe-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .mfe-badge {
      background: #007bff;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .mfe-url {
      font-family: monospace;
      background: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: #6c757d;
    }
    
    .mfe-content {
      flex: 1;
      position: relative;
      background: white;
      margin: 10px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .mfe-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-overlay p {
      color: #666;
      margin: 0;
      font-weight: 500;
    }
    
    .mfe-footer {
      background: #f8f9fa;
      padding: 10px 20px;
      border-top: 1px solid #dee2e6;
      text-align: center;
    }
    
    .mfe-footer small {
      color: #6c757d;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .mfe-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      
      .mfe-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
      
      .mfe-content {
        margin: 5px;
      }
    }
  `]
})
export class MfeWrapperComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  mfeUrl: string = '';
  title: string = '';
  safeMfeUrl: SafeResourceUrl | null = null;
  isLoading: boolean = true;

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.mfeUrl = data['mfeUrl'] || '';
      this.title = data['title'] || 'Microfrontend';

      if (this.mfeUrl) {
        this.safeMfeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.mfeUrl);
      }
    });

    // Setup communication with the iframe
    this.setupIframeCommunication();
  }

  onIframeLoad() {
    this.isLoading = false;

    // Send authentication state to the loaded MFE
    this.sendAuthStateToIframe();
  }

  /**
   * Setup communication with the iframe MFE
   */
  private setupIframeCommunication(): void {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;

      // Handle messages from the iframe
      switch (event.data.type) {
        case 'AUTH_STATE_REQUEST':
          this.sendAuthStateToIframe();
          break;
      }
    });
  }

  /**
   * Send authentication state to the iframe
   */
  private sendAuthStateToIframe(): void {
    const iframe = document.querySelector('.mfe-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'AUTH_STATE_RESPONSE',
        isAuthenticated: true, // This would come from auth service
        timestamp: Date.now()
      }, window.location.origin);
    }
  }
}
