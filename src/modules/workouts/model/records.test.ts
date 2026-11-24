import { describe, expect, it } from 'vitest';

import { checkSetRecord, computeExerciseRecords, detectWorkoutRecords } from './records';

describe('records (D-129)', () => {
  it('calcula peso máximo y RM máximo de un historial', () => {
    const history = [
      { weightKg: 50, reps: 6, rir: 0 }, // rm: 60
      { weightKg: 55, reps: 5, rir: 1 }, // rm: 66
      { weightKg: 60, reps: 3, rir: 0 }, // rm: 66
    ];
    const records = computeExerciseRecords(history);
    expect(records.maxWeightKg).toBe(60);
    expect(records.maxRm).toBe(66);
  });

  it('ignora series no hechas o con peso <= 0', () => {
    const history = [
      { weightKg: 100, reps: 5, isDone: false },
      { weightKg: 0, reps: 10, isDone: true },
      { weightKg: 40, reps: 8, rir: 2, isDone: true }, // rm: 53.3
    ];
    const records = computeExerciseRecords(history);
    expect(records.maxWeightKg).toBe(40);
    expect(records.maxRm).toBe(53.3);
  });

  it('criterio 3: si bato un peso máximo, dice que es récord', () => {
    const previousRecords = { maxWeightKg: 80, maxRm: 106.7 };

    // Bato el peso máximo con 82.5 kg pero menos reps (RM no bate récord)
    const result = checkSetRecord(
      { weightKg: 82.5, reps: 3, rir: 0 }, // rm: 82.5 * 1.1 = 90.75
      previousRecords,
    );

    expect(result.isMaxWeightRecord).toBe(true);
    expect(result.isMaxRmRecord).toBe(false);
    expect(result.isRecord).toBe(true);
  });

  it('detecta récord si bato el RM estimado aunque no sea más peso', () => {
    const previousRecords = { maxWeightKg: 80, maxRm: 90 };

    // Mismo peso 80 kg pero 8 reps con RIR 2 -> RM 106.7 kg > 90 kg
    const result = checkSetRecord({ weightKg: 80, reps: 8, rir: 2 }, previousRecords);

    expect(result.isMaxWeightRecord).toBe(false);
    expect(result.isMaxRmRecord).toBe(true);
    expect(result.isRecord).toBe(true);
  });

  it('detecta récords en un entreno completo para el resumen y actividad', () => {
    const prevHistory = new Map([
      ['ex-1', [{ weightKg: 50, reps: 6, rir: 0 }]], // maxWeight: 50, maxRm: 60
      ['ex-2', [{ weightKg: 30, reps: 10, rir: 0 }]], // maxWeight: 30, maxRm: 40
    ]);

    const workout = [
      {
        exerciseId: 'ex-1',
        sets: [
          { weightKg: 52.5, reps: 6, rir: 0 }, // récord (+1)
          { weightKg: 50, reps: 6, rir: 0 },
        ],
      },
      {
        exerciseId: 'ex-2',
        sets: [
          { weightKg: 25, reps: 8, rir: 0 }, // nada
        ],
      },
    ];

    const summary = detectWorkoutRecords(workout, prevHistory);
    expect(summary.recordsCount).toBe(1);
    expect(summary.exercisesWithRecords).toEqual(['ex-1']);
  });

  it('las series de calentamiento nunca baten récords ni entran en el historial máximo', () => {
    const records = computeExerciseRecords([
      { weightKg: 80, reps: 5, rir: 1, isDone: true, isWarmup: false },
      { weightKg: 120, reps: 10, rir: null, isDone: true, isWarmup: true },
    ]);
    expect(records.maxWeightKg).toBe(80);
    const check = checkSetRecord(
      { weightKg: 150, reps: 10, rir: null, isDone: true, isWarmup: true },
      records,
    );
    expect(check.isRecord).toBe(false);
  });
});
