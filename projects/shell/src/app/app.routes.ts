import { Routes } from '@angular/router';
import { AuthGuard } from 'shared';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./components/mfe-wrapper.component').then(m => m.MfeWrapperComponent),
    data: { mfeUrl: 'http://localhost:4203', title: 'Authentication' }
  },
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'unauthorized',
    redirectTo: '/auth/unauthorized',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/mfe-wrapper.component').then(m => m.MfeWrapperComponent),
    canActivate: [AuthGuard],
    data: { mfeUrl: 'http://localhost:4201', title: 'Dashboard' }
  },
  {
    path: 'users',
    loadComponent: () => import('./components/mfe-wrapper.component').then(m => m.MfeWrapperComponent),
    canActivate: [AuthGuard],
    data: { mfeUrl: 'http://localhost:4202', title: 'User Management' }
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
