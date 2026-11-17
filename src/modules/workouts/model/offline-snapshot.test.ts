import { describe, expect, it } from 'vitest';

import { previousFor, previousPerformances } from './offline-snapshot';
import type { OfflineSnapshot, PerformedExercise } from './offline-snapshot';

const SQUAT = 'squat';
const BENCH = 'bench';

function performed(overrides: Partial<PerformedExercise>): PerformedExercise {
  return {
    exerciseId: SQUAT,
    programId: 'program-1',
    dayNumber: 1,
    performedOn: '2026-11-02',
    changedAt: '2026-11-02T10:00:00Z',
    sets: [
      {
        setNumber: 1,
        side: 'none',
        weightKg: 100,
        reps: 5,
        durationSeconds: null,
        distanceMeters: null,
        intensityType: 'rir',
        intensityValue: 2,
      },
    ],
    ...overrides,
  };
}

function snapshotWith(rows: PerformedExercise[]): OfflineSnapshot {
  return {
    tenantId: 'tenant-1',
    savedAt: '2026-11-17T08:00:00Z',
    current: null,
    previous: previousPerformances(rows, 'program-1', new Set([SQUAT, BENCH])),
  };
}

describe('previousFor (D-120)', () => {
  it('lunes con lunes: la última vez en ese mismo día de la rutina, aunque después lo hiciera otro día', () => {
    const snapshot = snapshotWith([
      performed({ dayNumber: 1, performedOn: '2026-11-09' }),
      performed({ dayNumber: 3, performedOn: '2026-11-11' }),
      performed({ dayNumber: 1, performedOn: '2026-11-02' }),
    ]);

    expect(previousFor(snapshot, SQUAT, 1)?.performedOn).toBe('2026-11-09');
    expect(previousFor(snapshot, SQUAT, 3)?.performedOn).toBe('2026-11-11');
  });

  it('si no lo ha hecho en ese día, la última vez en cualquier día, también de otra rutina', () => {
    const snapshot = snapshotWith([
      performed({ dayNumber: 3, performedOn: '2026-11-04' }),
      performed({ programId: 'old-program', dayNumber: 5, performedOn: '2026-11-06' }),
    ]);

    const previous = previousFor(snapshot, SQUAT, 1);

    expect(previous?.performedOn).toBe('2026-11-06');
    expect(previous?.dayNumber).toBeNull();
  });

  it('el día de otra rutina no cuenta como el mismo día', () => {
    const snapshot = snapshotWith([
      performed({ programId: 'old-program', dayNumber: 1, performedOn: '2026-11-10' }),
      performed({ dayNumber: 1, performedOn: '2026-11-03' }),
    ]);

    expect(previousFor(snapshot, SQUAT, 1)?.performedOn).toBe('2026-11-03');
  });

  it('el mismo día, gana el último cambio', () => {
    const snapshot = snapshotWith([
      performed({ changedAt: '2026-11-02T09:00:00Z', sets: [] }),
      performed({ changedAt: '2026-11-02T11:00:00Z' }),
    ]);

    expect(previousFor(snapshot, SQUAT, 1)?.changedAt).toBe('2026-11-02T11:00:00Z');
  });

  it('si nunca lo ha hecho, o sin series hechas, no hay vez anterior', () => {
    const snapshot = snapshotWith([performed({ exerciseId: BENCH, sets: [] })]);

    expect(previousFor(snapshot, BENCH, 1)).toBeNull();
    expect(previousFor(snapshot, SQUAT, 1)).toBeNull();
  });

  it('solo se guardan los ejercicios de la rutina', () => {
    const previous = previousPerformances(
      [performed({ exerciseId: 'curl' })],
      'program-1',
      new Set([SQUAT]),
    );

    expect(previous).toEqual([]);
  });
});
