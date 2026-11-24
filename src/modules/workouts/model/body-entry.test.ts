import { describe, expect, it } from 'vitest';

import { parseDecimal, parseEntryDate, todayIso } from './body-entry';

describe('parseDecimal', () => {
  it('lee coma y punto', () => {
    expect(parseDecimal('82,5')).toBe(82.5);
    expect(parseDecimal(' 82.5 ')).toBe(82.5);
    expect(parseDecimal('85')).toBe(85);
  });

  it('rechaza lo que no es un número', () => {
    for (const text of ['', 'abc', '-3', '1e3', '82,5,1', '8 2']) {
      expect(parseDecimal(text)).toBeNull();
    }
  });
});

describe('todayIso', () => {
  it('usa el día de la zona del usuario, con ceros', () => {
    expect(todayIso(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
    expect(todayIso(new Date(2026, 0, 31, 0, 5))).toBe('2026-01-31');
  });
});

describe('parseEntryDate', () => {
  const today = '2026-11-16';

  it('acepta hoy y los días pasados', () => {
    expect(parseEntryDate('2026-11-16', today)).toEqual({ ok: true, date: '2026-11-16' });
    expect(parseEntryDate('2025-02-28', today)).toEqual({ ok: true, date: '2025-02-28' });
  });

  it('rechaza el futuro', () => {
    expect(parseEntryDate('2026-11-17', today)).toEqual({ ok: false, reason: 'future' });
  });

  it('rechaza días que no existen o texto raro', () => {
    for (const text of ['', '16/11/2026', '2026-02-30', '2026-13-01', '2026-1-1']) {
      expect(parseEntryDate(text, today)).toEqual({ ok: false, reason: 'invalid' });
    }
  });
});
