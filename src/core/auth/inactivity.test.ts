import { describe, expect, it } from 'vitest';

import {
  clearLastActiveAt,
  isInactiveTooLong,
  readLastActiveAt,
  writeLastActiveAt,
} from './inactivity';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);

describe('isInactiveTooLong', () => {
  it('pasados 31 días sin abrir la app, hay que volver a entrar (D-045)', () => {
    expect(isInactiveTooLong(NOW - 31 * DAY, NOW)).toBe(true);
  });

  it('a los 29 días, la sesión sigue', () => {
    expect(isInactiveTooLong(NOW - 29 * DAY, NOW)).toBe(false);
  });

  it('justo 30 días todavía cuentan como dentro del plazo', () => {
    expect(isInactiveTooLong(NOW - 30 * DAY, NOW)).toBe(false);
  });

  it('si nunca se apuntó nada, no se cierra la sesión', () => {
    expect(isInactiveTooLong(null, NOW)).toBe(false);
  });
});

describe('última vez que se abrió la app', () => {
  it('se guarda y se lee en el dispositivo', () => {
    writeLastActiveAt(NOW);
    expect(readLastActiveAt()).toBe(NOW);
    clearLastActiveAt();
    expect(readLastActiveAt()).toBeNull();
  });

  it('un valor estropeado cuenta como "nunca"', () => {
    localStorage.setItem('athlete-core.lastActiveAt', 'not-a-number');
    expect(readLastActiveAt()).toBeNull();
  });
});
