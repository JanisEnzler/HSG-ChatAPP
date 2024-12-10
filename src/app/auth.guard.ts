import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ApiService } from './api.service';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const router = inject(Router);
  const apiService = inject(ApiService);

  return apiService.validateToken().pipe(
    map(response => {
      console.log('Token is valid');
      return true;
    }),
    catchError(error => {
      console.error('Token is invalid', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
};
