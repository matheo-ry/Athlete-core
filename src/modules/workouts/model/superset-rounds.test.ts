import { describe, expect, it } from 'vitest';

import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import { changeSet, startWorkout } from './active-workout';
import type { ActiveWorkout } from './active-workout';
import { skipExercise } from './exercise-actions';
import { advanceTarget, completesRound, groupLabel, groupMembers } from './superset-rounds';

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

function item(exerciseId: string, supersetGroup: number | null, sets = 2) {
  return {
    id: `pde-${exerciseId}`,
    exerciseId,
    supersetGroup,
    restSeconds: null,
    note: null,
    sets: Array.from({ length: sets }, () => set),
  };
}

// 1 y 2 en una superserie; 3, 4 y 5 en un circuito (el 4 es unilateral); 6 suelto.
const day: ProgramDay = {
  id: 'day-1',
  dayNumber: 1,
  kind: 'training',
  name: null,
  subtitle: null,
  place: null,
  exercises: [
    item('a', 1),
    item('b', 1),
    item('c', 2),
    item('d', 2),
    item('e', 2),
    item('f', null),
  ],
};
const block: ProgramBlock = { id: 'block-1', name: null, cycleDays: 7, laps: null, days: [day] };

function workout(): ActiveWorkout {
  let next = 0;
  return startWorkout({
    tenantId: 'tenant-1',
    programId: 'program-1',
    block,
    day,
    exerciseInfo: (id) => ({ measurement: 'weight_reps', isUnilateral: id === 'd' }),
    now: '2026-11-16T08:00:00.000Z',
    newId: () => `id-${String((next += 1))}`,
  });
}

const NOW = '2026-11-16T08:10:00.000Z';
const reps = { reps: 8 };

describe('groupLabel', () => {
  it('dos son una superserie; tres o más, un circuito, con su puesto', () => {
    const started = workout();
    expect(groupLabel(started, 1)).toEqual({ kind: 'superset', position: 1, size: 2 });
    expect(groupLabel(started, 2)).toEqual({ kind: 'superset', position: 2, size: 2 });
    expect(groupLabel(started, 4)).toEqual({ kind: 'circuit', position: 2, size: 3 });
  });

  it('un ejercicio suelto no tiene marca', () => {
    expect(groupLabel(workout(), 6)).toBeNull();
    expect(groupMembers(workout(), 6)).toHaveLength(1);
  });
});

describe('advanceTarget (D-121)', () => {
  it('tras la serie 1 del primero pasa al segundo, en la misma serie', () => {
    const before = workout();
    const after = changeSet(before, 1, 1, reps, NOW);
    expect(advanceTarget(before, after, 1, 1)).toBe(2);
  });

  it('con la ronda hecha, vuelve al primero para la serie siguiente', () => {
    const first = changeSet(workout(), 1, 1, reps, NOW);
    const second = changeSet(first, 2, 1, reps, NOW);
    expect(advanceTarget(first, second, 2, 1)).toBe(1);
  });

  it('en un circuito pasa de uno en uno, y un unilateral solo avanza con los dos lados', () => {
    const first = changeSet(workout(), 3, 1, reps, NOW);
    expect(advanceTarget(workout(), first, 3, 1)).toBe(4);
    const right = changeSet(first, 4, 1, reps, NOW, 'right');
    expect(advanceTarget(first, right, 4, 1)).toBeNull();
    const left = changeSet(right, 4, 1, reps, NOW, 'left');
    expect(advanceTarget(right, left, 4, 1)).toBe(5);
  });

  it('corregir una serie ya hecha no mueve de pantalla', () => {
    const first = changeSet(workout(), 1, 1, reps, NOW);
    const fixed = changeSet(first, 1, 1, { reps: 9 }, NOW);
    expect(advanceTarget(first, fixed, 1, 1)).toBeNull();
  });

  it('un ejercicio suelto no mueve de pantalla', () => {
    const before = workout();
    expect(advanceTarget(before, changeSet(before, 6, 1, reps, NOW), 6, 1)).toBeNull();
  });

  it('salta a los saltados', () => {
    const skipped = skipExercise(workout(), 2, NOW);
    const after = changeSet(skipped, 1, 1, reps, NOW);
    // El único otro del grupo está saltado: la ronda ya está hecha y no hay a dónde ir.
    expect(advanceTarget(skipped, after, 1, 1)).toBeNull();
  });
});

describe('completesRound (descanso, D-121)', () => {
  it('en una superserie, el descanso arranca al acabar la ronda, no antes', () => {
    const start = workout();
    const first = changeSet(start, 1, 1, reps, NOW);
    expect(completesRound(start, first, 1, 1)).toBe(false);
    const second = changeSet(first, 2, 1, reps, NOW);
    expect(completesRound(first, second, 2, 1)).toBe(true);
  });

  it('corregir la ronda ya hecha no lo reinicia', () => {
    const first = changeSet(workout(), 1, 1, reps, NOW);
    const second = changeSet(first, 2, 1, reps, NOW);
    const fixed = changeSet(second, 1, 1, { reps: 9 }, NOW);
    expect(completesRound(second, fixed, 1, 1)).toBe(false);
  });

  it('en un unilateral suelto, arranca al apuntar el segundo lado (criterio 1)', () => {
    const solo: ProgramDay = { ...day, exercises: [item('d', null)] };
    let next = 0;
    const start = startWorkout({
      tenantId: 'tenant-1',
      programId: 'program-1',
      block: { ...block, days: [solo] },
      day: solo,
      exerciseInfo: () => ({ measurement: 'weight_reps', isUnilateral: true }),
      now: NOW,
      newId: () => `u-${String((next += 1))}`,
    });
    const right = changeSet(start, 1, 1, { weightKg: 30, reps: 9 }, NOW, 'right');
    expect(completesRound(start, right, 1, 1)).toBe(false);
    const left = changeSet(right, 1, 1, { weightKg: 30, reps: 8 }, NOW, 'left');
    expect(completesRound(right, left, 1, 1)).toBe(true);
  });

  it('un ejercicio suelto acaba la ronda con su serie', () => {
    const start = workout();
    expect(completesRound(start, changeSet(start, 6, 1, reps, NOW), 6, 1)).toBe(true);
  });

  it('los saltados no cuentan para la ronda', () => {
    const skipped = skipExercise(workout(), 2, NOW);
    const after = changeSet(skipped, 1, 1, reps, NOW);
    expect(completesRound(skipped, after, 1, 1)).toBe(true);
  });
});
