import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { createHash } from 'crypto';

import { AuthService } from './auth.service.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('Recuperar contraseña', () => {
  const config = {
    get: (key: string, fallback?: unknown) =>
      ({ JWT_SECRET: 'secret', WEB_URL: 'https://deruta.test/' } as Record<string, unknown>)[key] ?? fallback,
    getOrThrow: () => 'secret',
  };

  function setup() {
    const user = {
      id: 'u1',
      name: 'Ana',
      email: 'ana@test.com',
      isBlocked: false,
      passwordHash: 'viejo',
      refreshTokenHash: 'algo' as string | null,
      passwordResetTokenHash: null as string | null,
      passwordResetExpiresAt: null as Date | null,
    };
    const sent: { to: string; text: string }[] = [];
    const usersService = {
      findByEmail: async (email: string) => (email === user.email ? { ...user } : null),
      setPasswordResetToken: async (_id: string, tokenHash: string | null, expiresAt: Date | null) => {
        user.passwordResetTokenHash = tokenHash;
        user.passwordResetExpiresAt = expiresAt;
      },
      findByPasswordResetTokenHash: async (tokenHash: string) =>
        tokenHash === user.passwordResetTokenHash ? { ...user } : null,
      resetPassword: async (_id: string, passwordHash: string) => {
        Object.assign(user, {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          refreshTokenHash: null,
        });
      },
    };
    const emailFactory = { create: () => ({ send: async (mail: { to: string; text: string }) => void sent.push(mail) }) };
    const service = new AuthService(
      usersService as never,
      new JwtService({ secret: 'secret' }),
      config as never,
      emailFactory as never,
      {} as never,
    );
    return { service, user, sent };
  }

  const tokenFrom = (text: string) => /token=([a-f0-9]{64})/.exec(text)?.[1] ?? '';

  it('manda un link con un token y guarda solo su hash', async () => {
    const { service, user, sent } = setup();
    await service.forgotPassword('ana@test.com');

    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain('https://deruta.test/restablecer-clave?token=');
    const token = tokenFrom(sent[0].text);
    expect(token).toHaveLength(64);
    expect(user.passwordResetTokenHash).toBe(sha256(token));
  });

  it('no manda nada ni falla si el email no existe', async () => {
    const { service, sent } = setup();
    await expect(service.forgotPassword('nadie@test.com')).resolves.toBeUndefined();
    expect(sent).toHaveLength(0);
  });

  it('cambia la contraseña con un token válido, una sola vez, y cierra sesiones', async () => {
    const { service, user, sent } = setup();
    await service.forgotPassword('ana@test.com');
    const token = tokenFrom(sent[0].text);

    await service.resetPassword(token, 'clave-nueva-123');
    expect(await compare('clave-nueva-123', user.passwordHash)).toBe(true);
    expect(user.refreshTokenHash).toBeNull();

    await expect(service.resetPassword(token, 'otra-clave-123')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un token vencido', async () => {
    const { service, user, sent } = setup();
    await service.forgotPassword('ana@test.com');
    user.passwordResetExpiresAt = new Date(Date.now() - 1000);

    await expect(service.resetPassword(tokenFrom(sent[0].text), 'clave-nueva-123')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
