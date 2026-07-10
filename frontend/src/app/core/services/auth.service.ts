import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_KEY = 'iepp_access_token';
  private readonly REFRESH_KEY = 'iepp_refresh_token';
  private readonly USER_KEY = 'iepp_user';

  currentUser = signal<User | null>(this.lireUtilisateurStocke());

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login/`, { username, password })
      .pipe(
        tap((reponse) => {
          localStorage.setItem(this.ACCESS_KEY, reponse.access);
          localStorage.setItem(this.REFRESH_KEY, reponse.refresh);
          localStorage.setItem(this.USER_KEY, JSON.stringify(reponse.user));
          this.currentUser.set(reponse.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    return this.http
      .post<{ access: string }>(`${environment.apiUrl}/auth/refresh/`, { refresh })
      .pipe(tap((reponse) => localStorage.setItem(this.ACCESS_KEY, reponse.access)));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  private lireUtilisateurStocke(): User | null {
    const brut = localStorage.getItem(this.USER_KEY);
    return brut ? JSON.parse(brut) : null;
  }
}