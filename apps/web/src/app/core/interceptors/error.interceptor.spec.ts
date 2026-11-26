import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { jwtInterceptor } from './jwt.interceptor';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor: renovación de sesión', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const user = { id: 'u1', name: 'Ana' };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('deruta_access_token', 'viejo');
    localStorage.setItem('deruta_refresh_token', 'refresh-1');
    localStorage.setItem('deruta_user', JSON.stringify(user));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('renueva el token ante un 401 y reintenta el pedido', () => {
    let result: unknown;
    http.get('/api/v1/users/me').subscribe((r) => (result = r));

    const first = httpMock.expectOne('/api/v1/users/me');
    expect(first.request.headers.get('Authorization')).toBe('Bearer viejo');
    first.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne((r) => r.url.endsWith('/auth/refresh'));
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush({ accessToken: 'nuevo', refreshToken: 'refresh-2', user });

    const retry = httpMock.expectOne('/api/v1/users/me');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer nuevo');
    retry.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(auth.getToken()).toBe('nuevo');
    expect(auth.getRefreshToken()).toBe('refresh-2');
  });

  it('cierra la sesión si la renovación falla', () => {
    let failed = false;
    http.get('/api/v1/users/me').subscribe({ error: () => (failed = true) });

    httpMock
      .expectOne('/api/v1/users/me')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne((r) => r.url.endsWith('/auth/refresh'))
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(auth.getToken()).toBeNull();
  });

  it('no cierra la sesión por un login con clave incorrecta', () => {
    let failed = false;
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => (failed = true) });

    httpMock
      .expectOne('/api/v1/auth/login')
      .flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(auth.getToken()).toBe('viejo');
  });
});
