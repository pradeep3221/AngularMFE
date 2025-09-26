import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap, retry } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { protectedResourceMap } from '../config/auth.config';

/**
 * Authentication Interceptor for MFE3
 * 
 * This interceptor provides:
 * - Automatic Bearer token attachment
 * - Token refresh on 401 errors
 * - Request retry logic
 * - Protected resource handling
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);

  intercept(
    request: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Check if this request needs authentication
    if (!this.shouldAddToken(request)) {
      return next.handle(request);
    }

    // Add token to request
    return from(this.addTokenToRequest(request)).pipe(
      switchMap(authenticatedRequest => 
        next.handle(authenticatedRequest).pipe(
          retry(1), // Retry once on failure
          catchError(error => this.handleError(error, request, next))
        )
      )
    );
  }

  /**
   * Check if token should be added to this request
   */
  private shouldAddToken(request: HttpRequest<any>): boolean {
    // Don't add token to authentication endpoints
    if (request.url.includes('/auth/') || 
        request.url.includes('/login') || 
        request.url.includes('/logout')) {
      return false;
    }

    // Check if URL matches protected resources
    for (const [url] of protectedResourceMap) {
      if (request.url.startsWith(url)) {
        return true;
      }
    }

    // Add token to API requests
    return request.url.includes('/api/');
  }

  /**
   * Add authentication token to request
   */
  private async addTokenToRequest(request: HttpRequest<any>): Promise<HttpRequest<any>> {
    try {
      const token = await this.authService.getAccessToken();
      
      if (token) {
        return request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
    }

    return request;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(
    error: HttpErrorResponse, 
    originalRequest: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (error.status === 401) {
      // Token expired or invalid
      return this.handle401Error(originalRequest, next);
    }

    if (error.status === 403) {
      // Insufficient permissions
      console.warn('Access denied:', error.message);
    }

    if (error.status >= 500) {
      // Server error
      console.error('Server error:', error.message);
    }

    return throwError(() => error);
  }

  /**
   * Handle 401 Unauthorized errors
   */
  private handle401Error(
    originalRequest: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Try to refresh token and retry request
    return from(this.authService.getAccessToken()).pipe(
      switchMap(newToken => {
        if (newToken) {
          // Retry with new token
          const authenticatedRequest = originalRequest.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`
            }
          });
          return next.handle(authenticatedRequest);
        } else {
          // No valid token available, redirect to login
          this.authService.logout();
          return throwError(() => new Error('Authentication required'));
        }
      }),
      catchError(error => {
        // Token refresh failed, redirect to login
        this.authService.logout();
        return throwError(() => error);
      })
    );
  }
}

/**
 * Error Logging Interceptor
 * 
 * Logs HTTP errors for debugging and monitoring
 */
@Injectable()
export class ErrorLoggingInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logError(error, request);
        return throwError(() => error);
      })
    );
  }

  private logError(error: HttpErrorResponse, request: HttpRequest<any>): void {
    const errorInfo = {
      url: request.url,
      method: request.method,
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      timestamp: new Date().toISOString()
    };

    console.error('HTTP Error:', errorInfo);

    // In production, you might want to send this to a logging service
    // this.loggingService.logError(errorInfo);
  }
}

/**
 * Request Timing Interceptor
 * 
 * Measures and logs request timing for performance monitoring
 */
@Injectable()
export class TimingInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const startTime = Date.now();

    return next.handle(request).pipe(
      catchError(error => {
        this.logTiming(request, startTime, error.status);
        return throwError(() => error);
      }),
      // Log successful requests
      switchMap(event => {
        if (event.type === 4) { // HttpEventType.Response
          this.logTiming(request, startTime, (event as any).status);
        }
        return [event];
      })
    );
  }

  private logTiming(request: HttpRequest<any>, startTime: number, status: number): void {
    const duration = Date.now() - startTime;
    
    // Only log slow requests or errors
    if (duration > 1000 || status >= 400) {
      console.log(`HTTP ${request.method} ${request.url} - ${status} - ${duration}ms`);
    }
  }
}

/**
 * Cache Control Interceptor
 * 
 * Adds appropriate cache headers for different types of requests
 */
@Injectable()
export class CacheControlInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Add cache control headers based on request type
    let modifiedRequest = request;

    if (request.method === 'GET') {
      // Cache GET requests for static resources
      if (this.isStaticResource(request.url)) {
        modifiedRequest = request.clone({
          setHeaders: {
            'Cache-Control': 'public, max-age=3600' // 1 hour
          }
        });
      } else if (this.isApiRequest(request.url)) {
        // Don't cache API requests
        modifiedRequest = request.clone({
          setHeaders: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    }

    return next.handle(modifiedRequest);
  }

  private isStaticResource(url: string): boolean {
    return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url);
  }

  private isApiRequest(url: string): boolean {
    return url.includes('/api/');
  }
}

/**
 * CSRF Protection Interceptor
 * 
 * Adds CSRF token to state-changing requests
 */
@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Add CSRF token to state-changing requests
    if (this.isStateChangingRequest(request.method)) {
      const csrfToken = this.getCsrfToken();
      
      if (csrfToken) {
        const modifiedRequest = request.clone({
          setHeaders: {
            'X-CSRF-Token': csrfToken
          }
        });
        return next.handle(modifiedRequest);
      }
    }

    return next.handle(request);
  }

  private isStateChangingRequest(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }

  private getCsrfToken(): string | null {
    // Get CSRF token from meta tag or cookie
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  }
}
