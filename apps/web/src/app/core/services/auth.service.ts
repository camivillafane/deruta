import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'deruta_access_token';
  private readonly refreshKey = 'deruta_refresh_token';
  private readonly userKey = 'deruta_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated = signal(this.hasToken());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  verifyEmail(code: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/verify-email`, { code });
  }

  resendEmail(): Observable<{ emailVerificationCode?: string }> {
    return this.http.post<{ emailVerificationCode?: string }>(`${this.apiUrl}/resend-email`, {});
  }

  verifyPhone(code: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/verify-phone`, { code });
  }

  resendPhone(): Observable<{ phoneVerificationCode?: string }> {
    return this.http.post<{ phoneVerificationCode?: string }>(`${this.apiUrl}/resend-phone`, {});
  }

  submitIdentity(data: { dni: string; licenseNumber: string; licenseFrontImage: string; licenseBackImage: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/verify-identity`, data);
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/verification-status`).pipe(
      tap((user) => this.updateStoredUser(user)),
    );
  }

  isVerified(user?: User | null): boolean {
    const u = user || this.getCurrentUser();
    return !!u && u.emailVerified && u.phoneVerified && u.identityVerified;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshKey);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateStoredUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.accessToken);
    localStorage.setItem(this.refreshKey, response.refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.isAuthenticated.set(true);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem(this.userKey);
    return stored ? JSON.parse(stored) : null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
