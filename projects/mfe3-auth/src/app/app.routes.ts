import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { UserProfileComponent } from './auth/user-profile/user-profile.component';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';
import { AuthGuard, GuestGuard, AuthRouteHelper } from './auth/guards/auth.guard';

export const routes: Routes = [
  // Default route - redirect to login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // Authentication routes
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
    data: { title: 'Sign In' }
  },

  {
    path: 'callback',
    component: AuthCallbackComponent,
    data: { title: 'Processing Authentication' }
  },

  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    data: { title: 'Access Denied' }
  },

  // Protected routes
  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [AuthGuard],
    data: { title: 'User Profile' }
  },

  // Lazy-loaded auth module routes
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Wildcard route - redirect to login
  {
    path: '**',
    redirectTo: '/login'
  }
];
