import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Token Service for MFE3 Authentication
 * 
 * This service provides:
 * - Token validation and parsing
 * - Token expiration checking
 * - Secure token storage utilities
 * - JWT claims extraction
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly authService = inject(AuthService);
  
  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  public readonly token$ = this.tokenSubject.asObservable();

  /**
   * Get the current access token
   */
  async getAccessToken(): Promise<string | null> {
    return this.authService.getAccessToken();
  }

  /**
   * Check if a token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseJwtPayload(token);
      if (!payload.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = this.parseJwtPayload(token);
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiration(token: string): number {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return 0;
    
    return Math.max(0, expiration.getTime() - Date.now());
  }

  /**
   * Parse JWT payload
   */
  parseJwtPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to parse JWT token');
    }
  }

  /**
   * Parse JWT header
   */
  parseJwtHeader(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const header = parts[0];
      const decoded = atob(header.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to parse JWT header');
    }
  }

  /**
   * Extract user claims from token
   */
  extractClaims(token: string): any {
    try {
      return this.parseJwtPayload(token);
    } catch (error) {
      console.error('Failed to extract claims from token:', error);
      return null;
    }
  }

  /**
   * Get specific claim from token
   */
  getClaim(token: string, claimName: string): any {
    try {
      const claims = this.extractClaims(token);
      return claims?.[claimName];
    } catch (error) {
      console.error(`Failed to get claim '${claimName}' from token:`, error);
      return null;
    }
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Check if token is about to expire (within specified minutes)
   */
  isTokenExpiringSoon(token: string, minutesThreshold: number = 5): boolean {
    try {
      const timeUntilExpiration = this.getTimeUntilExpiration(token);
      const thresholdMs = minutesThreshold * 60 * 1000;
      return timeUntilExpiration <= thresholdMs;
    } catch {
      return true;
    }
  }

  /**
   * Get token issuer
   */
  getTokenIssuer(token: string): string | null {
    return this.getClaim(token, 'iss');
  }

  /**
   * Get token audience
   */
  getTokenAudience(token: string): string | string[] | null {
    return this.getClaim(token, 'aud');
  }

  /**
   * Get token subject (user ID)
   */
  getTokenSubject(token: string): string | null {
    return this.getClaim(token, 'sub');
  }

  /**
   * Get user roles from token
   */
  getUserRoles(token: string): string[] {
    const roles = this.getClaim(token, 'roles');
    return Array.isArray(roles) ? roles : [];
  }

  /**
   * Get user permissions from token
   */
  getUserPermissions(token: string): string[] {
    const permissions = this.getClaim(token, 'permissions');
    return Array.isArray(permissions) ? permissions : [];
  }

  /**
   * Check if token has specific role
   */
  tokenHasRole(token: string, role: string): boolean {
    const roles = this.getUserRoles(token);
    return roles.includes(role);
  }

  /**
   * Check if token has specific permission
   */
  tokenHasPermission(token: string, permission: string): boolean {
    const permissions = this.getUserPermissions(token);
    return permissions.includes(permission);
  }

  /**
   * Create a secure token storage key
   */
  private createStorageKey(suffix: string): string {
    return `mfe3_auth_${suffix}`;
  }

  /**
   * Store token securely (for demo purposes only)
   * In production, tokens should be stored in httpOnly cookies
   */
  storeTokenSecurely(token: string, type: 'access' | 'refresh' = 'access'): void {
    try {
      const key = this.createStorageKey(`${type}_token`);
      sessionStorage.setItem(key, token);
      
      if (type === 'access') {
        this.tokenSubject.next(token);
      }
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Retrieve token securely
   */
  retrieveTokenSecurely(type: 'access' | 'refresh' = 'access'): string | null {
    try {
      const key = this.createStorageKey(`${type}_token`);
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens
   */
  clearStoredTokens(): void {
    try {
      const accessKey = this.createStorageKey('access_token');
      const refreshKey = this.createStorageKey('refresh_token');
      
      sessionStorage.removeItem(accessKey);
      sessionStorage.removeItem(refreshKey);
      
      this.tokenSubject.next(null);
    } catch (error) {
      console.error('Failed to clear stored tokens:', error);
    }
  }

  /**
   * Validate token signature (basic check)
   * Note: This is a basic validation. In production, proper signature verification
   * should be done on the server side.
   */
  validateTokenSignature(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Basic format validation
      const header = this.parseJwtHeader(token);
      const payload = this.parseJwtPayload(token);
      
      // Check required fields
      return !!(header.alg && header.typ && payload.iss && payload.aud && payload.exp);
    } catch {
      return false;
    }
  }

  /**
   * Get token metadata
   */
  getTokenMetadata(token: string): {
    header: any;
    payload: any;
    isExpired: boolean;
    expiresAt: Date | null;
    timeUntilExpiration: number;
    isValid: boolean;
  } | null {
    try {
      const header = this.parseJwtHeader(token);
      const payload = this.parseJwtPayload(token);
      const isExpired = this.isTokenExpired(token);
      const expiresAt = this.getTokenExpiration(token);
      const timeUntilExpiration = this.getTimeUntilExpiration(token);
      const isValid = this.validateTokenSignature(token) && !isExpired;

      return {
        header,
        payload,
        isExpired,
        expiresAt,
        timeUntilExpiration,
        isValid
      };
    } catch (error) {
      console.error('Failed to get token metadata:', error);
      return null;
    }
  }
}
