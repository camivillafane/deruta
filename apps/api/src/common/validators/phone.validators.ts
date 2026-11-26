import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { normalizeArgentinePhone } from '../utils/phone.js';

export const PHONE_ERROR =
  'Ingresá un celular argentino con característica, por ejemplo 351 123 4567 o 11 2345 6789';

/**
 * Convierte el teléfono a +549XXXXXXXXXX. Si no se puede interpretar deja el
 * texto como vino, para que la validación lo rechace con un mensaje claro.
 */
export function IsArgentinePhone() {
  return applyDecorators(
    Transform(({ value }) => {
      if (typeof value !== 'string') return value;
      if (!value.trim()) return undefined; // vacío = no se manda (en el perfil no lo cambia)
      return normalizeArgentinePhone(value) ?? value;
    }),
    Matches(/^\+549[123]\d{9}$/, { message: PHONE_ERROR }),
  );
}
