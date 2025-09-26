import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse,
  HttpResponse 
} from '@angular/common/http';
import { Observable, throwError, from, EMPTY } from 'rxjs';
import { 
  switchMap, 
  catchError, 
  tap, 
  retry, 
  delay,
  mergeMap,
  finalize 
} from 'rxjs/operators';

import { AuthService } from './auth.service';
import { protectedResourceMap } from './auth.config';

/**
 * Authentication HTTP Interceptor
 * 
 * Automatically attaches access tokens to outgoing HTTP requests
 * and handles token refresh on 401 responses.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject: Observable<any> | null = null;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for certain requests
    if (this.shouldSkipAuth(req)) {
      return next.handle(req);
    }

    // Check if this request needs authentication
    if (!this.requiresAuth(req)) {
      return next.handle(req);
    }

    return from(this.authService.getAccessToken()).pipe(
      switchMap(token => {
        if (token) {
          // Clone request and add authorization header
          const authReq = this.addAuthHeader(req, token);
          return this.handleRequest(authReq, next);
        } else {
          // No token available, proceed without auth
          return next.handle(req);
        }
      }),
      catchError(error => this.handleError(error, req, next))
    );
  }

  /**
   * Handle the HTTP request with error handling and retry logic
   */
  private handleRequest(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          // Log successful requests in development
          if (!this.isProduction()) {
            console.log(`✅ ${req.method} ${req.url} - ${event.status}`);
          }
        }
      }),
      catchError(error => this.handleError(error, req, next))
    );
  }

  /**
   * Handle HTTP errors, especially 401 Unauthorized
   */
  private handleError(
    error: HttpErrorResponse, 
    req: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    
    if (error.status === 401) {
      return this.handle401Error(req, next);
    }

    if (error.status === 403) {
      console.warn('Access forbidden:', req.url);
      // Could redirect to unauthorized page or show notification
    }

    if (error.status >= 500) {
      console.error('Server error:', error);
      // Could implement retry logic for server errors
      return this.retryRequest(req, next, 2);
    }

    return throwError(() => error);
  }

  /**
   * Handle 401 Unauthorized errors with token refresh
   */
  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject = null;

      return from(this.authService.refreshToken()).pipe(
        switchMap(success => {
          this.isRefreshing = false;
          
          if (success) {
            // Token refreshed successfully, retry the original request
            return from(this.authService.getAccessToken()).pipe(
              switchMap(newToken => {
                if (newToken) {
                  const authReq = this.addAuthHeader(req, newToken);
                  return next.handle(authReq);
                }
                return this.redirectToLogin();
              })
            );
          } else {
            // Token refresh failed, redirect to login
            return this.redirectToLogin();
          }
        }),
        catchError(() => this.redirectToLogin()),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Token refresh is already in progress, wait for it to complete
      return this.waitForTokenRefresh().pipe(
        switchMap(() => {
          return from(this.authService.getAccessToken()).pipe(
            switchMap(token => {
              if (token) {
                const authReq = this.addAuthHeader(req, token);
                return next.handle(authReq);
              }
              return this.redirectToLogin();
            })
          );
        })
      );
    }
  }

  /**
   * Wait for ongoing token refresh to complete
   */
  private waitForTokenRefresh(): Observable<any> {
    return new Observable(observer => {
      const checkRefresh = () => {
        if (!this.isRefreshing) {
          observer.next(true);
          observer.complete();
        } else {
          setTimeout(checkRefresh, 100);
        }
      };
      checkRefresh();
    });
  }

  /**
   * Redirect to login and return empty observable
   */
  private redirectToLogin(): Observable<never> {
    console.warn('Token refresh failed, redirecting to login');
    this.authService.loginRedirect().catch(error => {
      console.error('Login redirect failed:', error);
    });
    return EMPTY;
  }

  /**
   * Retry failed requests with exponential backoff
   */
  private retryRequest(
    req: HttpRequest<any>,
    next: HttpHandler,
    maxRetries: number
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry(maxRetries),
      catchError(error => {
        console.error(`Request failed after ${maxRetries} retries:`, req.url, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add authorization header to request
   */
  private addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': req.headers.get('Content-Type') || 'application/json'
      }
    });
  }

  /**
   * Check if request should skip authentication
   */
  private shouldSkipAuth(req: HttpRequest<any>): boolean {
    // Skip auth for certain URLs
    const skipUrls = [
      '/assets/',
      '/api/public/',
      '/health',
      '/version',
      'login.microsoftonline.com',
      '.b2clogin.com'
    ];

    return skipUrls.some(url => req.url.includes(url)) ||
           req.headers.has('Skip-Auth') ||
           req.headers.has('No-Auth');
  }

  /**
   * Check if request requires authentication
   */
  private requiresAuth(req: HttpRequest<any>): boolean {
    // Check against protected resource map
    for (const [url, scopes] of protectedResourceMap.entries()) {
      if (req.url.startsWith(url)) {
        return true;
      }
    }

    // Default to requiring auth for API calls
    return req.url.includes('/api/') && !req.url.includes('/api/public/');
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' &&
           !window.location.hostname.includes('dev');
  }
}

/**
 * Error Logging Interceptor
 * 
 * Logs HTTP errors for monitoring and debugging
 */
@Injectable()
export class ErrorLoggingInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logError(error, req);
        return throwError(() => error);
      })
    );
  }

  private logError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    };

    // Log to console in development
    if (!this.isProduction()) {
      console.error('HTTP Error:', errorInfo);
    }

    // In production, you might want to send errors to a logging service
    // this.loggingService.logError(errorInfo);
  }

  private isProduction(): boolean {
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' &&
           !window.location.hostname.includes('dev');
  }
}

/**
 * Request Timing Interceptor
 * 
 * Measures and logs request timing for performance monitoring
 */
@Injectable()
export class TimingInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();
    
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          
          if (!this.isProduction() && duration > 1000) {
            console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
          }
          
          // In production, you might want to send timing data to analytics
          // this.analyticsService.trackRequestTiming(req.url, duration);
        }
      })
    );
  }

  private isProduction(): boolean {
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' &&
           !window.location.hostname.includes('dev');
  }
}
