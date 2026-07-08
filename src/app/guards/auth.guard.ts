import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) return true;
  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn && auth.isAdmin) return true;
  router.navigate(['/home']);
  return false;
};

export const tournamentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  return api.isTournamentOpen().pipe(
    map(r => r.open ? true : router.createUrlTree(['/home']))
  );
};
