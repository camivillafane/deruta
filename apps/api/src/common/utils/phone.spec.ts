import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { normalizeArgentinePhone } from './phone.js';
import { RegisterDto } from '../../auth/dto/auth.dto.js';
import { UpdateProfileDto } from '../../users/dto/user.dto.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('Teléfonos argentinos', () => {
  it.each([
    ['351 15 123-4567', '+5493511234567'],
    ['0351 15 123-4567', '+5493511234567'],
    ['0351 155 123456', '+5493515123456'],
    ['(0351) 4 123456', '+5493514123456'],
    ['3511234567', '+5493511234567'],
    ['11 2345-6789', '+5491123456789'],
    ['011 15 2345-6789', '+5491123456789'],
    ['11 15 2345 6789', '+5491123456789'],
    ['+54 9 11 2345 6789', '+5491123456789'],
    ['+54 11 2345 6789', '+5491123456789'],
    ['+54 9 351 15 123 4567', '+5493511234567'],
    ['0054 9 2966 123456', '+5492966123456'],
    ['549 2966 123456', '+5492966123456'],
    ['+5493511234567', '+5493511234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeArgentinePhone(input)).toBe(expected);
  });

  it.each([
    '',
    '15 1234 5678', // sin característica
    '1234',
    '351 123', // incompleto
    '+1 415 555 0100', // otro país
    'mi número es 351...',
    '0800 123 4567', // empieza con 8: no es una característica
  ])('rechaza %j', (input) => {
    expect(normalizeArgentinePhone(input)).toBeNull();
  });

  it('la copia del frontend es igual a la de la API', () => {
    const body = (file: string) => {
      const source = readFileSync(file, 'utf8');
      const start = source.indexOf('export function normalizeArgentinePhone');
      return source.slice(start, source.indexOf('\n}\n', start));
    };
    const api = body(join(here, 'phone.ts'));
    const web = body(join(here, '../../../../web/src/app/core/utils/phone.ts'));
    expect(web).toBe(api);
  });

  describe('DTOs', () => {
    const register = (phone?: string) =>
      plainToInstance(RegisterDto, { name: 'Ana', lastName: 'Paz', email: 'ana@test.com', password: 'clave-segura-1', phone });

    it('registro: normaliza el teléfono', async () => {
      const dto = register('351 15 123-4567');
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.phone).toBe('+5493511234567');
    });

    it('registro: el teléfono es obligatorio y tiene que ser válido', async () => {
      expect((await validate(register(undefined))).map((e) => e.property)).toContain('phone');
      expect((await validate(register(''))).map((e) => e.property)).toContain('phone');
      expect((await validate(register('15 1234 5678'))).map((e) => e.property)).toContain('phone');
    });

    it('perfil: vacío no cambia el teléfono; inválido se rechaza', async () => {
      const empty = plainToInstance(UpdateProfileDto, { phone: '' });
      expect(await validate(empty)).toHaveLength(0);
      expect(empty.phone).toBeUndefined();

      const invalid = plainToInstance(UpdateProfileDto, { phone: '1234' });
      expect((await validate(invalid)).map((e) => e.property)).toContain('phone');
    });
  });
});
