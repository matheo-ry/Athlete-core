import { describe, expect, it } from 'vitest';

import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import {
  activeWorkoutSchema,
  changeSet,
  prescribedReference,
  setCounts,
  startWorkout,
  toSyncPayload,
} from './active-workout';
import type { ActiveWorkout } from './active-workout';
import { isComplete } from './close-workout';
import {
  canSkip,
  replaceExercise,
  skipExercise,
  unskipExercise,
  withSides,
} from './exercise-actions';

const set = {
  id: null,
  repsMin: 8,
  repsMax: 8,
  durationSeconds: null,
  distanceMeters: null,
  intensityType: null,
  intensityValue: null,
  targetLoadKg: 60,
};

function item(exerciseId: string) {
  return {
    id: `pde-${exerciseId}`,
    exerciseId,
    supersetGroup: null,
    restSeconds: null,
    note: null,
    sets: [set, set],
  };
}

const day: ProgramDay = {
  id: 'day-1',
  dayNumber: 1,
  kind: 'training',
  name: null,
  subtitle: null,
  place: null,
  exercises: [item('bench'), item('row')],
};
const block: ProgramBlock = { id: 'block-1', name: null, cycleDays: 7, laps: null, days: [day] };
const NOW = '2026-11-16T08:10:00.000Z';

function workout(unilateral = false): ActiveWorkout {
  let next = 0;
  return startWorkout({
    tenantId: 'tenant-1',
    programId: 'program-1',
    block,
    day,
    exerciseInfo: () => ({ measurement: 'weight_reps', isUnilateral: unilateral }),
    now: '2026-11-16T08:00:00.000Z',
    newId: () => `id-${String((next += 1))}`,
  });
}

const dumbbell = { exerciseId: 'dumbbell-press', measurement: 'weight_reps' as const };

describe('saltar un ejercicio (D-122)', () => {
  it('no cuenta para el total ni para cerrar el entreno', () => {
    let current = skipExercise(workout(), 2, NOW);
    expect(current.exercises[1]?.isSkipped).toBe(true);
    expect(setCounts(current.exercises)).toEqual({ done: 0, total: 2 });
    current = changeSet(changeSet(current, 1, 1, { reps: 8 }, NOW), 1, 2, { reps: 8 }, NOW);
    expect(isComplete(current)).toBe(true);
  });

  it('se puede deshacer y vuelve a contar', () => {
    const skipped = skipExercise(workout(), 2, NOW);
    const undone = unskipExercise(skipped, 2, NOW);
    expect(undone.exercises[1]?.isSkipped).toBe(false);
    expect(setCounts(undone.exercises).total).toBe(4);
  });

  it('no se salta un ejercicio al que ya se le ha apuntado algo', () => {
    const started = changeSet(workout(), 1, 1, { reps: 8 }, NOW);
    expect(canSkip(started.exercises[0]!)).toBe(false);
    expect(skipExercise(started, 1, NOW)).toBe(started);
  });

  it('con todo saltado el entreno no se cierra solo', () => {
    const all = skipExercise(skipExercise(workout(), 1, NOW), 2, NOW);
    expect(isComplete(all)).toBe(false);
  });

  it('sube is_skipped y ninguna serie', () => {
    const skipped = skipExercise(workout(), 2, NOW);
    const exercises = toSyncPayload(skipped).exercises as {
      is_skipped: boolean;
      sets: unknown[];
    }[];
    expect(exercises[1]).toMatchObject({ is_skipped: true, sets: [] });
    expect(exercises[0]?.is_skipped).toBe(false);
  });
});

describe('cambiar un ejercicio (D-122)', () => {
  it('lo apuntado cuenta para el que se hizo y el de la rutina queda anotado', () => {
    const changed = replaceExercise(
      changeSet(workout(), 1, 1, { reps: 8 }, NOW),
      1,
      { ...dumbbell, isUnilateral: false },
      NOW,
      () => 'new',
    );
    const exercise = changed.exercises[0];
    expect(exercise).toMatchObject({ exerciseId: 'dumbbell-press', replacesExerciseId: 'bench' });
    // La serie ya apuntada se conserva: se mide igual.
    expect(exercise?.sets[0]).toMatchObject({ reps: 8, isDone: true });
    const payload = toSyncPayload(changed).exercises as {
      exercise_id: string;
      replaces_exercise_id: string | null;
    }[];
    expect(payload[0]).toMatchObject({
      exercise_id: 'dumbbell-press',
      replaces_exercise_id: 'bench',
    });
  });

  it('cambiar otra vez conserva el original; volver al original lo deshace', () => {
    const first = replaceExercise(
      workout(),
      1,
      { ...dumbbell, isUnilateral: false },
      NOW,
      () => 'n',
    );
    const second = replaceExercise(
      first,
      1,
      { exerciseId: 'machine-press', measurement: 'weight_reps', isUnilateral: false },
      NOW,
      () => 'n',
    );
    expect(second.exercises[0]).toMatchObject({
      exerciseId: 'machine-press',
      replacesExerciseId: 'bench',
    });
    const back = replaceExercise(
      second,
      1,
      { exerciseId: 'bench', measurement: 'weight_reps', isUnilateral: false },
      NOW,
      () => 'n',
    );
    expect(back.exercises[0]).toMatchObject({ exerciseId: 'bench', replacesExerciseId: null });
  });

  it('elegir el mismo ejercicio no cambia nada', () => {
    const started = workout();
    expect(
      replaceExercise(
        started,
        1,
        { exerciseId: 'bench', measurement: 'weight_reps', isUnilateral: false },
        NOW,
        () => 'n',
      ),
    ).toBe(started);
  });

  it('si pasa a unilateral, las series se rehacen por lados y sin lo apuntado', () => {
    let next = 0;
    const changed = replaceExercise(
      changeSet(workout(), 1, 1, { reps: 8 }, NOW),
      1,
      { ...dumbbell, isUnilateral: true },
      NOW,
      () => `s-${String((next += 1))}`,
    );
    expect(changed.exercises[0]?.sets.map((s) => [s.setNumber, s.side, s.isDone])).toEqual([
      [1, 'right', false],
      [1, 'left', false],
      [2, 'right', false],
      [2, 'left', false],
    ]);
  });

  it('la carga prescrita del de la rutina no se enseña para el que lo sustituye', () => {
    const changed = replaceExercise(
      workout(),
      1,
      { ...dumbbell, isUnilateral: false },
      NOW,
      () => 'n',
    );
    expect(prescribedReference(workout().exercises[0]!, 1)?.weightKg).toBe(60);
    expect(prescribedReference(changed.exercises[0]!, 1)?.weightKg).toBeNull();
    expect(prescribedReference(changed.exercises[0]!, 1)?.reps).toBe(8);
  });
});

describe('withSides: lo guardado antes de los lados', () => {
  it('lo apuntado pasa al lado derecho y se añade el izquierdo vacío', () => {
    const legacy = workout(true);
    const old: ActiveWorkout = {
      ...legacy,
      exercises: legacy.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets
          .filter((s) => s.side === 'right')
          .map((s, index) => ({ ...s, side: 'none' as const, reps: index === 0 ? 9 : null })),
      })),
    };
    let next = 0;
    const upgraded = withSides(old, () => `l-${String((next += 1))}`);
    expect(upgraded.exercises[0]?.sets.map((s) => [s.setNumber, s.side])).toEqual([
      [1, 'right'],
      [1, 'left'],
      [2, 'right'],
      [2, 'left'],
    ]);
    expect(upgraded.exercises[0]?.sets[0]?.reps).toBe(9);
    // Sin nada que poner al día, es el mismo entreno.
    expect(withSides(upgraded, () => 'x')).toBe(upgraded);
    expect(activeWorkoutSchema.safeParse(upgraded).success).toBe(true);
  });
});
