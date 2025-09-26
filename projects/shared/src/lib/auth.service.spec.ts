import { TestBed } from '@angular/core/testing';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no authenticated user', () => {
    expect(service.isAuthenticated).toBeFalse();
    expect(service.currentUser).toBeNull();
  });

  it('should authenticate user with correct credentials', (done) => {
    service.login('admin', 'password').subscribe((success) => {
      expect(success).toBeTrue();
      expect(service.isAuthenticated).toBeTrue();
      expect(service.currentUser?.username).toBe('admin');
      done();
    });
  });

  it('should reject user with incorrect credentials', (done) => {
    service.login('admin', 'wrongpassword').subscribe((success) => {
      expect(success).toBeFalse();
      expect(service.isAuthenticated).toBeFalse();
      expect(service.currentUser).toBeNull();
      done();
    });
  });

  it('should logout user', (done) => {
    service.login('admin', 'password').subscribe(() => {
      expect(service.isAuthenticated).toBeTrue();
      
      service.logout();
      
      expect(service.isAuthenticated).toBeFalse();
      expect(service.currentUser).toBeNull();
      done();
    });
  });

  it('should check user roles', (done) => {
    service.login('admin', 'password').subscribe(() => {
      expect(service.hasRole('admin')).toBeTrue();
      expect(service.hasRole('user')).toBeTrue();
      expect(service.hasRole('guest')).toBeFalse();
      done();
    });
  });

  it('should persist user in localStorage', (done) => {
    service.login('admin', 'password').subscribe(() => {
      const storedUser = localStorage.getItem('currentUser');
      expect(storedUser).toBeTruthy();
      
      const user = JSON.parse(storedUser!);
      expect(user.username).toBe('admin');
      done();
    });
  });
});
