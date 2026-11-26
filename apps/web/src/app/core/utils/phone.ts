// Copia de apps/api/src/common/utils/phone.ts (mantenerlas iguales).
/**
 * Normaliza un celular argentino al formato que necesita Twilio (E.164 móvil):
 * +549 + característica + número, 10 dígitos en total después del 9.
 *
 * Acepta las formas en que la gente lo escribe: "351 15 123-4567",
 * "0351 155 123456", "11 2345-6789", "+54 9 11 2345 6789", "+54 351 1234567",
 * "0054 9 ...". Devuelve null si no se puede interpretar (por ejemplo, sin
 * característica: "15 1234 5678").
 *
 */
export function normalizeArgentinePhone(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || /[^\d\s()+.\-]/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, '');
  const international = trimmed.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (international || (digits.startsWith('54') && digits.length >= 12)) {
    if (!digits.startsWith('54')) return null; // por ahora solo números de Argentina
    digits = digits.slice(2);
    if (digits.startsWith('9')) digits = digits.slice(1);
  }

  if (digits.startsWith('0')) digits = digits.slice(1);

  // "15" entre la característica (2 a 4 dígitos) y el número: se saca.
  if (digits.length === 12) {
    const withoutFifteen = [2, 3, 4]
      .filter((areaLength) => digits.slice(areaLength, areaLength + 2) === '15')
      .map((areaLength) => digits.slice(0, areaLength) + digits.slice(areaLength + 2))[0];
    if (!withoutFifteen) return null;
    digits = withoutFifteen;
  }

  // Característica + número = 10 dígitos; las características empiezan con 1, 2 o 3.
  // "15..." no es una característica: es el prefijo de celular sin la característica.
  if (!/^[123]\d{9}$/.test(digits) || digits.startsWith('15')) return null;
  return `+549${digits}`;
}

/** Validador de formularios: vacío pasa (usar junto con Validators.required si es obligatorio). */
export function argentinePhoneValidator(control: { value: unknown }): { phone: true } | null {
  const value = typeof control.value === 'string' ? control.value.trim() : '';
  if (!value) return null;
  return normalizeArgentinePhone(value) ? null : { phone: true };
}

export const PHONE_HINT = 'Celular con característica, por ejemplo 351 123 4567 o 11 2345 6789';
