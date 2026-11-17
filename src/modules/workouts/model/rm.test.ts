import { describe, expect, it } from 'vitest';

import { calculateEstimatedRm } from './rm';

describe('calculateEstimatedRm (D-129)', () => {
  it('criterio de aceptación 2: 50 × 6 (RIR 0) da un RM estimado de 60 kg', () => {
    const rm = calculateEstimatedRm({ weightKg: 50, reps: 6, rir: 0 });
    expect(rm).toBe(60);
  });

  it('criterio de aceptación 2: 80 × 8 (RIR 2) da un RM estimado de 106,7 kg', () => {
    const rm = calculateEstimatedRm({ weightKg: 80, reps: 8, rir: 2 });
    expect(rm).toBe(106.7);
  });

  it('calcula RIR a partir de RPE (RIR = 10 - RPE)', () => {
    // 80 × 8 con RPE 8 -> RIR 2 -> 106.7 kg
    const rm = calculateEstimatedRm({ weightKg: 80, reps: 8, rpe: 8 });
    expect(rm).toBe(106.7);
  });

  it('acepta intensityType y intensityValue con rir', () => {
    const rm = calculateEstimatedRm({
      weightKg: 80,
      reps: 8,
      intensityType: 'rir',
      intensityValue: 2,
    });
    expect(rm).toBe(106.7);
  });

  it('acepta intensityType y intensityValue con rpe', () => {
    const rm = calculateEstimatedRm({
      weightKg: 80,
      reps: 8,
      intensityType: 'rpe',
      intensityValue: 8,
    });
    expect(rm).toBe(106.7);
  });

  it('al fallo equivale a RIR 0', () => {
    const rm = calculateEstimatedRm({
      weightKg: 50,
      reps: 6,
      intensityType: 'failure',
    });
    expect(rm).toBe(60);
  });

  it('no se calcula con más de 12 repeticiones efectivas', () => {
    // 12 reps con RIR 0 -> 12 reps efectivas: se calcula
    expect(calculateEstimatedRm({ weightKg: 50, reps: 12, rir: 0 })).toBe(70);

    // 13 reps con RIR 0 -> 13 reps: null
    expect(calculateEstimatedRm({ weightKg: 50, reps: 13, rir: 0 })).toBeNull();

    // 10 reps con RIR 3 -> 13 reps: null
    expect(calculateEstimatedRm({ weightKg: 50, reps: 10, rir: 3 })).toBeNull();
  });

  it('devuelve null si no hay peso o es 0', () => {
    expect(calculateEstimatedRm({ weightKg: null, reps: 8, rir: 0 })).toBeNull();
    expect(calculateEstimatedRm({ weightKg: 0, reps: 8, rir: 0 })).toBeNull();
    expect(calculateEstimatedRm({ weightKg: -10, reps: 8, rir: 0 })).toBeNull();
  });

  it('devuelve null si no hay repeticiones o es 0', () => {
    expect(calculateEstimatedRm({ weightKg: 80, reps: null, rir: 0 })).toBeNull();
    expect(calculateEstimatedRm({ weightKg: 80, reps: 0, rir: 0 })).toBeNull();
  });

  it('calcula 1 repetición con RIR 0', () => {
    // 100 × 1 (RIR 0) -> 100 * (1 + 1/30) = 103.3 kg
    expect(calculateEstimatedRm({ weightKg: 100, reps: 1, rir: 0 })).toBe(103.3);
  });
});
