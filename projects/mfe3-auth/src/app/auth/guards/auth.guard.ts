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
import { map, catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

/**
 * Authentication Guard for MFE3
 * 
 * This guard provides:
 * - Route protection based on authentication status
 * - Automatic redirect to login page
 * - Support for role-based access control
 * - Integration with MSAL and demo authentication
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Guard for route activation
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuthentication(state.url, route.data);
  }

  /**
   * Guard for child route activation
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(childRoute, state);
  }

  /**
   * Guard for lazy-loaded modules
   */
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkAuthentication(`/${url}`, route.data);
  }

  /**
   * Check authentication status and handle redirects
   */
  private checkAuthentication(url: string, routeData?: any): Observable<boolean> {
    return new Observable<boolean>(observer => {
      // Check if user is authenticated
      if (this.authService.isAuthenticated()) {
        // Check role-based access if required
        if (routeData?.requiredRoles) {
          const hasRequiredRole = this.checkRoleAccess(routeData.requiredRoles);
          if (!hasRequiredRole) {
            this.router.navigate(['/auth/unauthorized']);
            observer.next(false);
            observer.complete();
            return;
          }
        }

        // Check permission-based access if required
        if (routeData?.requiredPermissions) {
          const hasRequiredPermission = this.checkPermissionAccess(routeData.requiredPermissions);
          if (!hasRequiredPermission) {
            this.router.navigate(['/auth/unauthorized']);
            observer.next(false);
            observer.complete();
            return;
          }
        }

        observer.next(true);
        observer.complete();
      } else {
        // Store the attempted URL for redirecting after login
        this.storeReturnUrl(url);
        
        // Redirect to login
        this.router.navigate(['/auth/login']);
        observer.next(false);
        observer.complete();
      }
    }).pipe(
      catchError(error => {
        console.error('Authentication guard error:', error);
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }

  /**
   * Check if user has required roles
   */
  private checkRoleAccess(requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return this.authService.hasAnyRole(requiredRoles);
  }

  /**
   * Check if user has required permissions
   */
  private checkPermissionAccess(requiredPermissions: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.some(permission => 
      this.authService.hasPermission(permission)
    );
  }

  /**
   * Store the return URL for post-login redirect
   */
  private storeReturnUrl(url: string): void {
    if (url && url !== '/auth/login') {
      sessionStorage.setItem('auth:returnUrl', url);
    }
  }

  /**
   * Get and clear the stored return URL
   */
  static getAndClearReturnUrl(): string | null {
    const returnUrl = sessionStorage.getItem('auth:returnUrl');
    if (returnUrl) {
      sessionStorage.removeItem('auth:returnUrl');
      return returnUrl;
    }
    return null;
  }
}

/**
 * Role-based Guard
 * 
 * Specific guard for role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  static getAndClearReturnUrl(): string | null {
    return AuthGuard.getAndClearReturnUrl();
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredRoles = route.data['requiredRoles'] as string[];
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (this.authService.hasAnyRole(requiredRoles)) {
      return true;
    }

    this.router.navigate(['/auth/unauthorized']);
    return false;
  }
}

/**
 * Admin Guard
 * 
 * Specific guard for admin-only access
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  static getAndClearReturnUrl(): string | null {
    return AuthGuard.getAndClearReturnUrl();
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const isAdmin = this.authService.hasRole('admin') || this.authService.hasRole('administrator');
    
    if (isAdmin) {
      return true;
    }

    this.router.navigate(['/auth/unauthorized']);
    return false;
  }
}

/**
 * Guest Guard
 * 
 * Guard for routes that should only be accessible to non-authenticated users
 */
@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isAuthenticated()) {
      // Redirect authenticated users to home or dashboard
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}

/**
 * Permission Guard
 * 
 * Guard for permission-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  static getAndClearReturnUrl(): string | null {
    return AuthGuard.getAndClearReturnUrl();
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredPermissions = route.data['requiredPermissions'] as string[];
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const hasPermission = requiredPermissions.some(permission => 
      this.authService.hasPermission(permission)
    );

    if (hasPermission) {
      return true;
    }

    this.router.navigate(['/auth/unauthorized']);
    return false;
  }
}

/**
 * Route data interfaces for type safety
 */
export interface AuthRouteData {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  allowGuest?: boolean;
  adminOnly?: boolean;
}

/**
 * Helper functions for route configuration
 */
export class AuthRouteHelper {
  /**
   * Create a protected route configuration
   */
  static createProtectedRoute(path: string, component: any, options?: {
    roles?: string[];
    permissions?: string[];
    adminOnly?: boolean;
  }) {
    const guards: any[] = [AuthGuard];
    const data: AuthRouteData = {};

    if (options?.adminOnly) {
      guards.push(AdminGuard);
      data.adminOnly = true;
    } else if (options?.roles) {
      guards.push(RoleGuard);
      data.requiredRoles = options.roles;
    }

    if (options?.permissions) {
      guards.push(PermissionGuard);
      data.requiredPermissions = options.permissions;
    }

    return {
      path,
      component,
      canActivate: guards,
      data
    };
  }

  /**
   * Create a guest-only route configuration
   */
  static createGuestRoute(path: string, component: any) {
    return {
      path,
      component,
      canActivate: [GuestGuard],
      data: { allowGuest: true }
    };
  }

  /**
   * Create an admin-only route configuration
   */
  static createAdminRoute(path: string, component: any) {
    return {
      path,
      component,
      canActivate: [AuthGuard, AdminGuard],
      data: { adminOnly: true }
    };
  }
}
