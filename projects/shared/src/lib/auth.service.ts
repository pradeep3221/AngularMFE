import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    // Check if user is already logged in (e.g., from localStorage)
    this.checkAuthStatus();
  }

  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  login(username: string, password: string): Observable<boolean> {
    // Simulate login API call
    return new Observable(observer => {
      setTimeout(() => {
        if (username === 'admin' && password === 'password') {
          const user: User = {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            roles: ['admin', 'user']
          };
          this.setCurrentUser(user);
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    localStorage.removeItem('currentUser');
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private checkAuthStatus(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.setCurrentUser(user);
    }
  }

  hasRole(role: string): boolean {
    const user = this.currentUser;
    return user ? user.roles.includes(role) : false;
  }
}
