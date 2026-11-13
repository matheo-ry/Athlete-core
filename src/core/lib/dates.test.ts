import { describe, expect, it } from 'vitest';

import { formatDate, formatDateTime } from './dates';

const STORED_UTC = '2026-01-15T23:30:00Z';

describe('formatDate', () => {
  it('muestra la fecha en la zona horaria indicada', () => {
    expect(formatDate(STORED_UTC, 'en', 'UTC')).toBe('Jan 15, 2026');
  });

  it('cambia de día cuando la zona del usuario ya está en el día siguiente', () => {
    expect(formatDate(STORED_UTC, 'en', 'Asia/Tokyo')).toBe('Jan 16, 2026');
  });

  it('acepta un objeto Date', () => {
    expect(formatDate(new Date(STORED_UTC), 'en', 'UTC')).toBe('Jan 15, 2026');
  });

  it('falla con un valor que no es una fecha', () => {
    expect(() => formatDate('not-a-date', 'en')).toThrow('Invalid date value');
  });
});

describe('formatDateTime', () => {
  it('incluye la hora en la zona indicada', () => {
    const text = formatDateTime(STORED_UTC, 'en', 'UTC');
    expect(text).toContain('Jan 15, 2026');
    expect(text).toContain('11:30');
  });
});
