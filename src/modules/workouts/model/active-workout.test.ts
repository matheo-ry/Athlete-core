import { describe, expect, it } from 'vitest';

import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import {
  changeSet,
  finishWorkout,
  prescribedReference,
  setCounts,
  startWorkout,
  stepValue,
  toSyncPayload,
} from './active-workout';

const prescribed = {
  id: null,
  repsMin: 8,
  repsMax: 12,
  durationSeconds: null,
  distanceMeters: null,
  intensityType: 'rir' as const,
  intensityValue: 1,
  targetLoadKg: 40,
};

const day: ProgramDay = {
  id: '00000000-0000-4000-8000-000000000010',
  dayNumber: 1,
  kind: 'training',
  name: 'Empuje',
  subtitle: null,
  place: null,
  exercises: [
    {
      id: '00000000-0000-4000-8000-000000000011',
      exerciseId: 'ex-bench',
      supersetGroup: null,
      restSeconds: 120,
      note: null,
      sets: [prescribed, prescribed, prescribed],
    },
    {
      id: '00000000-0000-4000-8000-000000000012',
      exerciseId: 'ex-plank',
      supersetGroup: null,
      restSeconds: null,
      note: 'Sin arquear',
      sets: [{ ...prescribed, repsMin: null, repsMax: null, durationSeconds: 45 }],
    },
    {
      id: null,
      exerciseId: 'ex-lunge',
      supersetGroup: null,
      restSeconds: null,
      note: null,
      sets: [prescribed],
    },
  ],
};

const block: ProgramBlock = { id: 'block-1', name: null, cycleDays: 7, laps: null, days: [day] };

function workout() {
  let next = 0;
  return startWorkout({
    tenantId: 'tenant-1',
    programId: 'program-1',
    block,
    day,
    exerciseInfo: (id) => ({
      measurement: id === 'ex-plank' ? 'time' : 'weight_reps',
      isUnilateral: id === 'ex-lunge',
    }),
    now: '2026-11-16T08:00:00.000Z',
    newId: () => `id-${String((next += 1))}`,
  });
}

describe('startWorkout', () => {
  it('crea las series prescritas, vacías y sin hacer', () => {
    const started = workout();
    expect(started.exercises.map((item) => item.sets.length)).toEqual([3, 1, 1]);
    expect(setCounts(started.exercises)).toEqual({ done: 0, total: 5 });
    expect(started.closedAt).toBeNull();
  });
});

describe('changeSet', () => {
  it('ilumina la serie al cambiar un dato y recuerda el ejercicio', () => {
    const changed = changeSet(workout(), 1, 2, { weightKg: 42.5 }, '2026-11-16T08:10:00.000Z');
    const set = changed.exercises[0]?.sets[1];
    expect(set).toMatchObject({ weightKg: 42.5, isDone: true });
    expect(set?.recordedAt).toBe('2026-11-16T08:10:00.000Z');
    expect(changed.lastExercise).toBe(1);
    expect(setCounts(changed.exercises).done).toBe(1);
  });
});

describe('stepValue', () => {
  it('sube y baja por pasos, sin bajar de 0', () => {
    expect(stepValue(10, 2.5, 1, 1000)).toBe(12.5);
    expect(stepValue(1, 2.5, -1, 1000)).toBe(0);
    expect(stepValue(7.5, 0.5, 1, 10)).toBe(8);
    expect(stepValue(10, 1, 1, 10)).toBe(10);
  });
});

describe('prescribedReference', () => {
  it('toma el tope del rango y la carga prescrita', () => {
    expect(prescribedReference(workout().exercises[0]!, 1)).toMatchObject({
      weightKg: 40,
      reps: 12,
    });
  });
});

describe('toSyncPayload', () => {
  it('sube solo lo tocado, con lo que casa con la forma de medir', () => {
    let changed = changeSet(workout(), 1, 1, { reps: 10 }, '2026-11-16T08:10:00.000Z');
    changed = changeSet(
      changed,
      2,
      1,
      { durationSeconds: 50, reps: 3 },
      '2026-11-16T08:20:00.000Z',
    );
    changed = changeSet(changed, 3, 1, { reps: 8 }, '2026-11-16T08:30:00.000Z');
    const payload = toSyncPayload(changed) as { exercises: { sets: Record<string, unknown>[] }[] };
    expect(payload.exercises[0]?.sets).toHaveLength(1);
    expect(payload.exercises[1]?.sets[0]).toMatchObject({ duration_seconds: 50, reps: null });
    // Los unilaterales, por lado, desde el PR 3.8.
    expect(payload.exercises[2]?.sets).toEqual([]);
    expect(payload).toMatchObject({ closed_at: null, close_reason: null });
  });

  it('al terminar, sube el cierre a mano', () => {
    const closed = finishWorkout(workout(), '2026-11-16T09:00:00.000Z');
    expect(toSyncPayload(closed)).toMatchObject({
      closed_at: '2026-11-16T09:00:00.000Z',
      close_reason: 'manual',
    });
  });
});
