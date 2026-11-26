import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/** Zona horaria de negocio: las fechas de viaje son fechas de calendario en Argentina. */
export const APP_TIME_ZONE = 'America/Argentina/Buenos_Aires';

/** Fecha de hoy (YYYY-MM-DD) en Argentina, sin importar la zona del servidor. */
export function todayInAppTimeZone(now: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * true si `value` es una fecha de hoy en adelante. Se compara como fecha de
 * calendario (YYYY-MM-DD): convertir a Date la interpreta como medianoche UTC,
 * que en Argentina es el día anterior a las 21 h, y "hoy" quedaba como pasado.
 */
export function isTodayOrFutureDate(value: unknown, now: Date = new Date()): boolean {
  if (typeof value !== 'string') return false;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  if (isNaN(new Date(`${day}T00:00:00Z`).getTime())) return false;
  return day >= todayInAppTimeZone(now);
}

export function IsFutureDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDateString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return isTodayOrFutureDate(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser una fecha válida en el futuro`;
        },
      },
    });
  };
}

export function IsTimeString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimeString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') return false;
          return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener formato HH:MM o HH:MM:SS`;
        },
      },
    });
  };
}
