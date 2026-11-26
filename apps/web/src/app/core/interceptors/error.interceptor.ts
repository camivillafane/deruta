import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Pedidos de auth donde un 401 es una respuesta esperada (credenciales, refresh vencido). */
function isAuthRequest(req: HttpRequest<unknown>): boolean {
  return /\/auth\/(login|register|refresh)$/.test(req.url.split('?')[0]);
}

/**
 * Ante un 401, intenta renovar la sesión con el refresh token y reintenta el
 * pedido una vez. Solo cierra la sesión si la renovación falla o el reintento
 * vuelve a dar 401 (por ejemplo, cuenta bloqueada).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthRequest(req)) {
        return throwError(() => error);
      }

      if (!authService.getRefreshToken()) {
        authService.logout();
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        catchError(() => {
          authService.logout();
          return throwError(() => error);
        }),
        switchMap((token) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
            catchError((retryError: HttpErrorResponse) => {
              if (retryError.status === 401) {
                authService.logout();
              }
              return throwError(() => retryError);
            }),
          ),
        ),
      );
    }),
  );
};
