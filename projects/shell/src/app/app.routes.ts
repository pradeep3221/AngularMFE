import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/mfe-wrapper.component').then(m => m.MfeWrapperComponent),
    data: { mfeUrl: 'http://localhost:4201', title: 'Dashboard' }
  },
  {
    path: 'users',
    loadComponent: () => import('./components/mfe-wrapper.component').then(m => m.MfeWrapperComponent),
    data: { mfeUrl: 'http://localhost:4202', title: 'User Management' }
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
