import { isTodayOrFutureDate, todayInAppTimeZone } from './date.validators.js';

describe('Validación de fechas de viaje', () => {
  // 26/11/2026 a las 10:00 en Argentina (13:00 UTC).
  const now = new Date('2026-11-26T13:00:00Z');

  it('calcula "hoy" en la zona de Argentina', () => {
    expect(todayInAppTimeZone(now)).toBe('2026-11-26');
    // 23:30 del 26 en Argentina ya es el 27 en UTC: sigue siendo 26.
    expect(todayInAppTimeZone(new Date('2026-11-27T02:30:00Z'))).toBe('2026-11-26');
  });

  it('acepta hoy y fechas futuras', () => {
    expect(isTodayOrFutureDate('2026-11-26', now)).toBe(true);
    expect(isTodayOrFutureDate('2026-11-27', now)).toBe(true);
    expect(isTodayOrFutureDate('2026-11-26T00:00:00.000Z', now)).toBe(true);
  });

  it('rechaza fechas pasadas y valores inválidos', () => {
    expect(isTodayOrFutureDate('2026-11-25', now)).toBe(false);
    expect(isTodayOrFutureDate('no-es-fecha', now)).toBe(false);
    expect(isTodayOrFutureDate('2026-13-40', now)).toBe(false);
    expect(isTodayOrFutureDate(20261126, now)).toBe(false);
  });
});
