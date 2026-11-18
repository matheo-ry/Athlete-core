import { describe, expect, it } from 'vitest';

import type { ActiveWorkout } from './active-workout';
import {
  REMINDER_AFTER_MS,
  TIMEOUT_AFTER_MS,
  isTimedOut,
  reminderAt,
  reminderId,
  timeoutDelay,
  weekdayName,
} from './workout-timers';

const LAST = '2026-11-16T12:00:00.000Z';
const LAST_MS = Date.parse(LAST);
const workout = { lastChangedAt: LAST } as ActiveWorkout;

describe('reminderAt', () => {
  it('avisa a las 6 horas del último cambio', () => {
    expect(reminderAt(workout, LAST_MS)?.getTime()).toBe(LAST_MS + REMINDER_AFTER_MS);
  });

  it('si ya pasó, no avisa', () => {
    expect(reminderAt(workout, LAST_MS + REMINDER_AFTER_MS)).toBeNull();
  });
});

describe('las 12 horas', () => {
  it('se cumplen justo a las 12 horas del último cambio', () => {
    expect(isTimedOut(LAST, LAST_MS + TIMEOUT_AFTER_MS - 1)).toBe(false);
    expect(isTimedOut(LAST, LAST_MS + TIMEOUT_AFTER_MS)).toBe(true);
    expect(timeoutDelay(LAST, LAST_MS + 1000)).toBe(TIMEOUT_AFTER_MS - 1000);
    expect(timeoutDelay(LAST, LAST_MS + TIMEOUT_AFTER_MS + 1000)).toBe(0);
  });
});

describe('reminderId', () => {
  it('es siempre el mismo para un negocio, positivo y entero', () => {
    const id = reminderId('00000000-0000-4000-8000-000000000001');
    expect(id).toBe(reminderId('00000000-0000-4000-8000-000000000001'));
    expect(id).not.toBe(reminderId('00000000-0000-4000-8000-000000000002'));
    expect(Number.isInteger(id) && id > 0 && id <= 2_147_483_647).toBe(true);
  });
});

describe('weekdayName', () => {
  it('dice el día en el idioma de la app', () => {
    // Mediodía: es lunes en cualquier zona habitual del ordenador de los tests.
    expect(weekdayName(LAST, 'es')).toBe('lunes');
    expect(weekdayName(LAST, 'en')).toBe('Monday');
  });
});
