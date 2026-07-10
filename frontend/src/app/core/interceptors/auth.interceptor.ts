import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const requete = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requete).pipe(
    catchError((erreur: HttpErrorResponse) => {
      // 401 + un token de rafraîchissement existant : on tente un refresh puis on rejoue la requête.
      if (erreur.status === 401 && auth.getRefreshToken() && !req.url.includes('/auth/refresh/')) {
        return auth.refreshToken().pipe(
          switchMap(() => {
            const nouveauToken = auth.getAccessToken();
            const requeteRejouee = req.clone({
              setHeaders: { Authorization: `Bearer ${nouveauToken}` },
            });
            return next(requeteRejouee);
          }),
          catchError((erreurRefresh) => {
            auth.logout();
            return throwError(() => erreurRefresh);
          })
        );
      }
      // 403 : abonnement expiré ou permission refusée — pas de refresh utile ici.
      return throwError(() => erreur);
    })
  );
};