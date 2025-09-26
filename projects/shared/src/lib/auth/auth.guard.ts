import { Injectable, inject } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  CanLoad, 
  Router, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Route, 
  UrlSegment 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, tap, catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';

/**
 * Authentication Guard
 * 
 * Protects routes and ensures users are authenticated before accessing protected resources.
 * Implements multiple guard interfaces for comprehensive route protection.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Guard for individual routes
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuthentication(state.url, route.data);
  }

  /**
   * Guard for child routes
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuthentication(state.url, childRoute.data);
  }

  /**
   * Guard for lazy-loaded modules
   */
  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkAuthentication(`/${url}`, route.data);
  }

  /**
   * Core authentication check logic
   */
  private checkAuthentication(url: string, routeData?: any): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        // If still loading, wait for authentication state to be determined
        if (authState.isLoading) {
          return false;
        }

        // Check if user is authenticated
        if (!authState.isAuthenticated) {
          console.warn(`Access denied to ${url}: User not authenticated`);
          this.redirectToLogin(url);
          return false;
        }

        // Check role-based access if specified in route data
        if (routeData?.requiredRoles) {
          const hasRequiredRole = this.checkRoleAccess(routeData.requiredRoles, authState.user?.roles || []);
          if (!hasRequiredRole) {
            console.warn(`Access denied to ${url}: Insufficient permissions`);
            this.redirectToUnauthorized();
            return false;
          }
        }

        // Check specific permissions if specified
        if (routeData?.requiredPermissions) {
          const hasPermissions = this.checkPermissions(routeData.requiredPermissions, authState.user);
          if (!hasPermissions) {
            console.warn(`Access denied to ${url}: Missing required permissions`);
            this.redirectToUnauthorized();
            return false;
          }
        }

        return true;
      }),
      catchError(error => {
        console.error('Authentication guard error:', error);
        this.redirectToLogin(url);
        return of(false);
      })
    );
  }

  /**
   * Check if user has required roles
   */
  private checkRoleAccess(requiredRoles: string | string[], userRoles: string[]): boolean {
    if (!requiredRoles) return true;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Check if user has required permissions
   */
  private checkPermissions(requiredPermissions: string[], user: any): boolean {
    if (!requiredPermissions || !user) return true;
    
    // This is a placeholder - implement based on your permission system
    // You might check against user claims, roles, or a separate permission service
    const userPermissions = user.permissions || [];
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(returnUrl: string): void {
    // Store the attempted URL for post-login redirect
    sessionStorage.setItem('auth:returnUrl', returnUrl);
    
    // Trigger login flow
    this.authService.loginRedirect().catch(error => {
      console.error('Login redirect failed:', error);
    });
  }

  /**
   * Redirect to unauthorized page
   */
  private redirectToUnauthorized(): void {
    this.router.navigate(['/unauthorized']).catch(error => {
      console.error('Navigation to unauthorized page failed:', error);
    });
  }
}

/**
 * Role-based Guard
 * 
 * Specialized guard for role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return of(true);
    }

    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        if (!authState.isAuthenticated) {
          this.router.navigate(['/login']);
          return false;
        }

        const userRoles = authState.user?.roles || [];
        const hasRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

/**
 * Admin Guard
 * 
 * Specialized guard for admin-only access
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        if (!authState.isAuthenticated) {
          this.router.navigate(['/login']);
          return false;
        }

        const isAdmin = this.authService.hasRole('admin') || this.authService.hasRole('administrator');
        
        if (!isAdmin) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

/**
 * Guest Guard
 * 
 * Prevents authenticated users from accessing guest-only pages (like login)
 */
@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        if (authState.isAuthenticated) {
          // Redirect authenticated users to dashboard
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }
}

/**
 * Token Validation Guard
 * 
 * Ensures tokens are valid and not expired
 */
@Injectable({
  providedIn: 'root'
})
export class TokenGuard implements CanActivate {
  private readonly authService = inject(AuthService);

  canActivate(): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        if (!authState.isAuthenticated || !authState.accessToken) {
          return false;
        }

        // Check token expiration
        try {
          const tokenPayload = this.parseJwt(authState.accessToken);
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (tokenPayload.exp && tokenPayload.exp < currentTime) {
            console.warn('Access token expired');
            // Trigger token refresh
            this.authService.refreshToken();
            return false;
          }
          
          return true;
        } catch (error) {
          console.error('Token validation failed:', error);
          return false;
        }
      })
    );
  }

  /**
   * Parse JWT token payload
   */
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
}
