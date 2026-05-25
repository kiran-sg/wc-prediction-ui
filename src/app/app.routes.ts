import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'home', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent), canActivate: [authGuard] },
  { path: 'predict/:matchId', loadComponent: () => import('./components/predict/predict.component').then(m => m.PredictComponent), canActivate: [authGuard] },
  { path: 'leaderboard', loadComponent: () => import('./components/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent), canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' }
];
