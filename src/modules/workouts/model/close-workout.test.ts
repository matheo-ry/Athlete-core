import { describe, expect, it } from 'vitest';

import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import { changeSet, finishWorkout, startWorkout } from './active-workout';
import type { ActiveWorkout } from './active-workout';
import { skipExercise } from './exercise-actions';
import { COMPLETE_GRACE_MS, autoCloseDelay, finishedSummary, isComplete } from './close-workout';

const set = {
  id: null,
  repsMin: 8,
  repsMax: 8,
  durationSeconds: null,
  distanceMeters: null,
  intensityType: null,
  intensityValue: null,
  targetLoadKg: null,
};

const day: ProgramDay = {
  id: 'day-1',
  dayNumber: 1,
  kind: 'training',
  name: null,
  subtitle: null,
  place: null,
  exercises: [
    {
      id: 'pde-1',
      exerciseId: 'ex-1',
      supersetGroup: null,
      restSeconds: null,
      note: null,
      sets: [set, set],
    },
    {
      id: 'pde-2',
      exerciseId: 'ex-2',
      supersetGroup: null,
      restSeconds: null,
      note: null,
      sets: [set],
    },
  ],
};

const block: ProgramBlock = { id: 'block-1', name: null, cycleDays: 7, laps: null, days: [day] };
const START = '2026-11-16T08:00:00.000Z';

function workout(): ActiveWorkout {
  let next = 0;
  return startWorkout({
    tenantId: 'tenant-1',
    programId: 'program-1',
    block,
    day,
    exerciseInfo: () => ({ measurement: 'weight_reps', isUnilateral: false }),
    now: START,
    newId: () => `id-${String((next += 1))}`,
  });
}

function allDone(at: string): ActiveWorkout {
  let current = changeSet(workout(), 1, 1, { reps: 8 }, '2026-11-16T08:10:00.000Z');
  current = changeSet(current, 1, 2, { reps: 8 }, '2026-11-16T08:20:00.000Z');
  return changeSet(current, 2, 1, { reps: 8 }, at);
}

describe('isComplete', () => {
  it('solo con todas las series de todos los ejercicios hechas', () => {
    expect(isComplete(workout())).toBe(false);
    expect(isComplete(changeSet(workout(), 1, 1, { reps: 8 }, START))).toBe(false);
    expect(isComplete(allDone('2026-11-16T08:45:00.000Z'))).toBe(true);
  });
});

describe('ejercicios saltados (D-122)', () => {
  const skipSecond = (at: string) => skipExercise(workout(), 2, at);

  it('se cierra solo apuntando todo lo demás (criterio 4)', () => {
    let current = skipSecond(START);
    expect(isComplete(current)).toBe(false);
    current = changeSet(current, 1, 1, { reps: 8 }, '2026-11-16T08:10:00.000Z');
    current = changeSet(current, 1, 2, { reps: 8 }, '2026-11-16T08:20:00.000Z');
    expect(isComplete(current)).toBe(true);
    expect(autoCloseDelay(current, Date.parse('2026-11-16T08:20:00.000Z'), true)).toBe(0);
  });

  it('el resumen no cuenta los saltados', () => {
    const current = changeSet(skipSecond(START), 1, 1, { reps: 8 }, '2026-11-16T08:10:00.000Z');
    expect(finishedSummary(finishWorkout(current, '2026-11-16T08:30:00.000Z'))).toMatchObject({
      setsDone: 1,
      exercisesDone: 1,
      exercisesTotal: 1,
    });
  });
});

describe('autoCloseDelay', () => {
  const last = '2026-11-16T08:45:00.000Z';
  const lastMs = Date.parse(last);

  it('con algo pendiente o ya cerrado, no se cierra solo', () => {
    expect(autoCloseDelay(workout(), lastMs, true)).toBeNull();
    expect(autoCloseDelay(finishWorkout(allDone(last), last), lastMs, true)).toBeNull();
  });

  it('con todo hecho, en el resumen se cierra enseguida', () => {
    expect(autoCloseDelay(allDone(last), lastMs, true)).toBe(0);
  });

  it('en el ejercicio, espera unos segundos desde el último cambio (D-149)', () => {
    expect(autoCloseDelay(allDone(last), lastMs, false)).toBe(COMPLETE_GRACE_MS);
    expect(autoCloseDelay(allDone(last), lastMs + 15_000, false)).toBe(COMPLETE_GRACE_MS - 15_000);
    // Al abrir la app horas después, se cierra al momento.
    expect(autoCloseDelay(allDone(last), lastMs + 3_600_000, false)).toBe(0);
  });
});

describe('finishedSummary', () => {
  it('duración hasta el último dato, series hechas y ejercicios', () => {
    const partial = changeSet(workout(), 1, 1, { reps: 8 }, '2026-11-16T08:47:00.000Z');
    // Cerrarlo al día siguiente no alarga la duración.
    const closed = finishWorkout(partial, '2026-11-17T10:00:00.000Z');
    expect(finishedSummary(closed)).toEqual({
      minutes: 47,
      setsDone: 1,
      exercisesDone: 1,
      exercisesTotal: 2,
    });
  });
});
