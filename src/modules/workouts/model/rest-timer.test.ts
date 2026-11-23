import { describe, expect, it } from 'vitest';

import {
  adjustRest,
  formatClock,
  isFinished,
  pauseRest,
  remainingMs,
  restSecondsFor,
  resumeRest,
  setRest,
  shouldStartRest,
  startRest,
} from './rest-timer';

const T0 = 1_000_000;

describe('cuenta del descanso', () => {
  it('se calcula con la hora de fin, no contando segundos', () => {
    const timer = startRest('w1', 120, T0);
    expect(remainingMs(timer, T0)).toBe(120_000);
    // Pantalla apagada 90 s: al volver, quedan 30.
    expect(remainingMs(timer, T0 + 90_000)).toBe(30_000);
    expect(isFinished(timer, T0 + 120_000)).toBe(true);
    expect(remainingMs(timer, T0 + 500_000)).toBe(0);
  });

  it('pausar congela lo que queda y reanudar sigue desde ahí', () => {
    const paused = pauseRest(startRest('w1', 120, T0), T0 + 20_000);
    expect(remainingMs(paused, T0 + 999_999)).toBe(100_000);
    const resumed = resumeRest(paused, T0 + 60_000);
    expect(remainingMs(resumed, T0 + 70_000)).toBe(90_000);
  });

  it('suma y resta 15 s sin bajar de 0 ni pasar de una hora', () => {
    const timer = startRest('w1', 10, T0);
    expect(remainingMs(adjustRest(timer, 15, T0), T0)).toBe(25_000);
    expect(remainingMs(adjustRest(timer, -15, T0), T0)).toBe(0);
    expect(remainingMs(adjustRest(startRest('w1', 3600, T0), 15, T0), T0)).toBe(3_600_000);
  });

  it('ajusta también en pausa', () => {
    const paused = pauseRest(startRest('w1', 60, T0), T0);
    expect(remainingMs(adjustRest(paused, 15, T0 + 5000), T0 + 5000)).toBe(75_000);
  });

  it('un atajo cambia el descanso entero', () => {
    expect(remainingMs(setRest(startRest('w1', 120, T0), 180, T0 + 10_000), T0 + 10_000)).toBe(
      180_000,
    );
  });
});

describe('qué descanso toca', () => {
  it('el coach manda sobre el del cliente', () => {
    expect(
      restSecondsFor({ manualSeconds: null, coachSeconds: 90, clientDefaultSeconds: 120 }),
    ).toBe(90);
  });
  it('sin el del coach, el del cliente', () => {
    expect(
      restSecondsFor({ manualSeconds: null, coachSeconds: null, clientDefaultSeconds: 120 }),
    ).toBe(120);
  });
  it('lo cambiado a mano en este entreno manda sobre todo', () => {
    expect(
      restSecondsFor({ manualSeconds: 180, coachSeconds: 90, clientDefaultSeconds: 120 }),
    ).toBe(180);
  });
});

describe('cuándo arranca', () => {
  it('con el primer cambio de una serie', () => {
    expect(shouldStartRest({ wasDone: false, autostart: true })).toBe(true);
  });
  it('corregir una serie ya hecha no lo reinicia', () => {
    expect(shouldStartRest({ wasDone: true, autostart: true })).toBe(false);
  });
  it('con "Arrancar el descanso solo" apagado, nunca', () => {
    expect(shouldStartRest({ wasDone: false, autostart: false })).toBe(false);
  });
});

describe('formatClock', () => {
  it('da minutos y segundos', () => {
    expect(formatClock(120_000)).toBe('2:00');
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(1)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
  });
});
