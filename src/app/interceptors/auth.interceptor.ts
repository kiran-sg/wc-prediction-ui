import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const stored = sessionStorage.getItem('wc_user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user?.userId) {
      req = req.clone({ setHeaders: { 'X-User-Id': user.userId } });
    }
  }
  return next(req);
};
