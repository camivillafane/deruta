import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';

import { AuthService, MAX_VERIFICATION_ATTEMPTS } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { normalizeEmail } from '../users/users.service.js';

const SECRET = 'test-secret';

function makeConfig() {
  return {
    get: (key: string, fallback?: unknown) => (key === 'JWT_SECRET' ? SECRET : fallback),
    getOrThrow: () => SECRET,
  };
}

describe('Seguridad de auth', () => {
  const jwt = new JwtService({ secret: SECRET });

  it('normaliza emails', () => {
    expect(normalizeEmail('  Martin@Example.COM ')).toBe('martin@example.com');
  });

  describe('tipos de token', () => {
    const usersService = {
      findById: async () => ({ id: 'u1', isBlocked: false }),
    };
    const strategy = new JwtStrategy(makeConfig() as never, usersService as never);

    it('la API acepta access tokens', async () => {
      await expect(strategy.validate({ sub: 'u1', email: 'a@b.c', typ: 'access' })).resolves.toEqual({
        userId: 'u1',
        email: 'a@b.c',
      });
    });

    it('la API rechaza refresh tokens y tokens sin tipo', async () => {
      await expect(strategy.validate({ sub: 'u1', email: 'a@b.c', typ: 'refresh' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      await expect(strategy.validate({ sub: 'u1', email: 'a@b.c' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('/auth/refresh rechaza un access token y tokens inválidos', async () => {
      const service = new AuthService({} as never, jwt, makeConfig() as never, {} as never, {} as never);
      const access = jwt.sign({ sub: 'u1', email: 'a@b.c', typ: 'access' });
      await expect(service.refresh(access)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(service.refresh('basura')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('/auth/refresh emite tokens con tipo a partir de un refresh token válido', async () => {
      const refresh = jwt.sign({ sub: 'u1', email: 'a@b.c', typ: 'refresh' });
      const user = { id: 'u1', email: 'a@b.c', isBlocked: false, refreshTokenHash: await hash(refresh, 4) };
      const usersService = {
        findByIdWithCredentials: async () => user,
        setRefreshTokenHash: async () => undefined,
      };
      const service = new AuthService(usersService as never, jwt, makeConfig() as never, {} as never, {} as never);

      const result = await service.refresh(refresh);
      expect(jwt.decode(result.accessToken).typ).toBe('access');
      expect(jwt.decode(result.refreshToken).typ).toBe('refresh');
    });
  });

  describe('intentos de código de verificación', () => {
    it(`invalida el código después de ${MAX_VERIFICATION_ATTEMPTS} intentos fallidos`, async () => {
      const user = {
        id: 'u1',
        emailVerified: false,
        emailVerificationCode: '123456' as string | null,
        emailVerificationAttempts: 0,
      };
      const usersService = {
        findByIdWithCredentials: async () => ({ ...user }),
        setVerificationCodes: async (_id: string, codes: Partial<typeof user>) => Object.assign(user, codes),
      };
      const service = new AuthService(usersService as never, jwt, makeConfig() as never, {} as never, {} as never);

      for (let i = 1; i < MAX_VERIFICATION_ATTEMPTS; i++) {
        await expect(service.verifyEmail('u1', { code: '000000' })).rejects.toThrow('Código incorrecto');
      }
      await expect(service.verifyEmail('u1', { code: '000000' })).rejects.toThrow('Demasiados intentos');
      expect(user.emailVerificationCode).toBeNull();

      // Ni siquiera el código correcto sirve: hay que pedir uno nuevo.
      await expect(service.verifyEmail('u1', { code: '123456' })).rejects.toThrow('Pedí un código nuevo');
    });
  });
});
