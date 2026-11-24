import { describe, expect, it } from 'vitest';

import type { ProgramBlock, ProgramDay } from '@/modules/programs';

import {
  MAX_SETS,
  activeWorkoutSchema,
  addSet,
  changeSet,
  copyPrevious,
  copySides,
  copySource,
  exerciseToResume,
  previousSet,
  unmarkSet,
  finishWorkout,
  isWeightJump,
  prescribedReference,
  setCounts,
  setDayNote,
  setWorkoutNote,
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
    // El unilateral lleva derecha e izquierda en cada serie (D-121).
    expect(started.exercises.map((item) => item.sets.length)).toEqual([3, 1, 2]);
    expect(started.exercises[2]?.sets.map((item) => item.side)).toEqual(['right', 'left']);
    expect(setCounts(started.exercises)).toEqual({ done: 0, total: 5 });
    expect(started.closedAt).toBeNull();
  });
});

const previousValues = {
  weightKg: 30,
  reps: 8,
  durationSeconds: null,
  distanceMeters: null,
  intensityType: null,
  intensityValue: null,
};

describe('unilaterales (D-121)', () => {
  const NOW = '2026-11-16T08:10:00.000Z';

  it('cada lado se apunta por separado y la serie cuenta cuando están los dos', () => {
    const right = changeSet(workout(), 3, 1, { weightKg: 30, reps: 9 }, NOW, 'right');
    expect(right.exercises[2]?.sets.map((item) => item.isDone)).toEqual([true, false]);
    expect(setCounts(right.exercises).done).toBe(0);
    const both = changeSet(right, 3, 1, { weightKg: 30, reps: 8 }, NOW, 'left');
    expect(setCounts(both.exercises).done).toBe(1);
    expect(both.exercises[2]?.sets.map((item) => item.reps)).toEqual([9, 8]);
  });

  it('sube cada lado con su fila y su lado', () => {
    const right = changeSet(workout(), 3, 1, { weightKg: 30, reps: 9 }, NOW, 'right');
    const left = changeSet(right, 3, 1, { weightKg: 30, reps: 8 }, NOW, 'left');
    const exercises = toSyncPayload(left).exercises as {
      sets: { side: string; reps: number }[];
    }[];
    expect(exercises[2]?.sets.map((item) => [item.side, item.reps])).toEqual([
      ['right', 9],
      ['left', 8],
    ]);
  });

  it('"Igual" copia los dos lados', () => {
    const copied = copySides(
      workout(),
      3,
      1,
      {
        right: { ...previousValues, reps: 9 },
        left: { ...previousValues, reps: 8 },
      },
      NOW,
    );
    expect(copied.exercises[2]?.sets.map((item) => [item.side, item.reps, item.isDone])).toEqual([
      ['right', 9, true],
      ['left', 8, true],
    ]);
  });

  it('desmarcar apaga los dos lados y "+ Serie" añade una por lado', () => {
    const copied = copySides(workout(), 3, 1, { right: previousValues, left: previousValues }, NOW);
    expect(setCounts(unmarkSet(copied, 3, 1, NOW).exercises).done).toBe(0);
    const more = addSet(workout(), 3, NOW, () => crypto.randomUUID());
    expect(more.exercises[2]?.sets.map((item) => [item.setNumber, item.side])).toEqual([
      [1, 'right'],
      [1, 'left'],
      [2, 'right'],
      [2, 'left'],
    ]);
  });

  it('"previousSet" busca el lado pedido', () => {
    const previous = {
      sets: [
        { setNumber: 1, side: 'right', ...previousValues, reps: 9 },
        { setNumber: 1, side: 'left', ...previousValues, reps: 8 },
      ],
    };
    expect(previousSet(previous, 1, 'left')?.reps).toBe(8);
    expect(previousSet(previous, 1)).toBeNull();
  });

  it('lo guardado antes del PR 3.8 se lee sin lado', () => {
    const parsed = activeWorkoutSchema.parse(
      JSON.parse(
        JSON.stringify(workout(), (key, value: unknown) =>
          key === 'side' || key === 'isSkipped' || key === 'replacesExerciseId' ? undefined : value,
        ),
      ),
    );
    expect(parsed.exercises[0]?.sets[0]?.side).toBe('none');
    expect(parsed.exercises[0]?.isSkipped).toBe(false);
    expect(parsed.exercises[0]?.replacesExerciseId).toBeNull();
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

  it('el cierre solo sube su motivo (PR 3.6)', () => {
    const closed = finishWorkout(workout(), '2026-11-16T09:00:00.000Z', 'completed');
    expect(toSyncPayload(closed)).toMatchObject({ close_reason: 'completed' });
  });

  it('la fecha es la del último dato cambiado, aunque se cierre al día siguiente (D-119)', () => {
    // La 01:30 del martes en UTC sigue siendo lunes en Nueva York; se fija la
    // hora del mediodía para que valga en cualquier zona del ordenador de los tests.
    const changed = changeSet(workout(), 1, 1, { reps: 8 }, '2026-11-16T12:00:00.000Z');
    const closed = finishWorkout(changed, '2026-11-17T12:00:00.000Z');
    expect(closed.lastChangedAt).toBe('2026-11-16T12:00:00.000Z');
    expect(toSyncPayload(closed)).toMatchObject({ performed_on: '2026-11-16' });
  });

  it('lo guardado en el teléfono antes del PR 3.6 se lee sin motivo de cierre', () => {
    const stored: Record<string, unknown> = { ...workout() };
    delete stored.closeReason;
    expect(activeWorkoutSchema.parse(stored).closeReason).toBeNull();
  });
});

describe('desmarcar, "+ Serie", "Igual" y reanudar (PR 3.5b)', () => {
  const at = '2026-11-16T08:10:00.000Z';

  it('tocar una serie iluminada la apaga y no cuenta', () => {
    const lit = changeSet(workout(), 1, 1, { reps: 10 }, at);
    const off = unmarkSet(lit, 1, 1, at);
    expect(off.exercises[0]?.sets[0]).toMatchObject({ reps: 10, isDone: false });
    expect(setCounts(off.exercises).done).toBe(0);
  });

  it('"+ Serie" añade una extra vacía, hasta 10', () => {
    let current = workout();
    for (let index = 0; index < 12; index += 1) {
      current = addSet(current, 1, at, () => `extra-${String(index)}`);
    }
    const sets = current.exercises[0]?.sets ?? [];
    expect(sets).toHaveLength(MAX_SETS);
    expect(sets[3]).toMatchObject({ setNumber: 4, isExtra: true, isDone: false });
  });

  it('"Igual" copia la vez anterior en esa serie', () => {
    const before = previousSet(
      {
        sets: [
          {
            setNumber: 1,
            side: 'none',
            weightKg: 10,
            reps: 12,
            durationSeconds: null,
            distanceMeters: null,
            intensityType: 'rir',
            intensityValue: 1,
          },
        ],
      },
      1,
    );
    expect(before).not.toBeNull();
    if (before === null) {
      return;
    }
    const copied = copyPrevious(workout(), 1, 1, before, at);
    expect(copied.exercises[0]?.sets[0]).toMatchObject({ weightKg: 10, reps: 12, isDone: true });
    expect(previousSet(null, 1)).toBeNull();
  });

  it('al abrir, el último ejercicio tocado si le quedan series; si no, el siguiente', () => {
    let current = changeSet(workout(), 2, 1, { durationSeconds: 40 }, at);
    // El 2 (plancha) ya no tiene series pendientes: toca el 3.
    expect(exerciseToResume(current)).toBe(3);
    current = changeSet(current, 1, 1, { reps: 5 }, at);
    expect(exerciseToResume(current)).toBe(1);
  });
});

describe('"Igual" según el ajuste del Perfil (D-120)', () => {
  const at = '2026-11-16T08:10:00.000Z';
  const lastTime = {
    weightKg: 50,
    reps: 5,
    durationSeconds: null,
    distanceMeters: null,
    intensityType: null,
    intensityValue: null,
  };

  it('por defecto copia la vez anterior en esa serie', () => {
    const done = changeSet(workout(), 1, 1, { weightKg: 60, reps: 8 }, at);
    const exercise = done.exercises[0];
    expect(exercise).toBeDefined();
    if (exercise === undefined) {
      return;
    }
    expect(copySource('previous', exercise, 2, lastTime)).toEqual(lastTime);
  });

  it('"copiar la serie anterior de hoy": la serie 1 copia la vez anterior y la 2 copia la serie 1 de hoy', () => {
    const done = changeSet(workout(), 1, 1, { weightKg: 60, reps: 8 }, at);
    const exercise = done.exercises[0];
    if (exercise === undefined) {
      throw new Error('missing exercise');
    }
    expect(copySource('previous_then_today', exercise, 1, lastTime)).toEqual(lastTime);
    expect(copySource('previous_then_today', exercise, 2, lastTime)).toMatchObject({
      weightKg: 60,
      reps: 8,
    });
  });

  it('si la serie anterior de hoy no está hecha, no hay nada que copiar', () => {
    const exercise = workout().exercises[0];
    if (exercise === undefined) {
      throw new Error('missing exercise');
    }
    expect(copySource('previous_then_today', exercise, 2, lastTime)).toBeNull();
  });
});

describe('setDayNote (D-122)', () => {
  it('guarda la nota del día en el ejercicio indicado y actualiza la fecha de cambio', () => {
    const initial = workout();
    const updated = setDayNote(initial, 1, 'Dolor de hombro', '2026-11-20T10:00:00.000Z');
    expect(updated.exercises[0]?.dayNote).toBe('Dolor de hombro');
    expect(updated.lastChangedAt).toBe('2026-11-20T10:00:00.000Z');
    expect(updated.lastExercise).toBe(1);
  });

  it('recorta espacios y limita a 500 caracteres', () => {
    const initial = workout();
    const longText = 'a'.repeat(600);
    const updated = setDayNote(initial, 1, `  ${longText}  `, '2026-11-20T10:00:00.000Z');
    expect(updated.exercises[0]?.dayNote).toHaveLength(500);
  });

  it('un texto vacío o null se guarda como null', () => {
    const initial = setDayNote(workout(), 1, 'Nota previa', '2026-11-20T10:00:00.000Z');
    const cleared = setDayNote(initial, 1, '   ', '2026-11-20T10:05:00.000Z');
    expect(cleared.exercises[0]?.dayNote).toBeNull();
  });

  it('se serializa en toSyncPayload como day_note', () => {
    const updated = setDayNote(workout(), 1, 'Molestia leve', '2026-11-20T10:00:00.000Z');
    const payload = toSyncPayload(updated);
    const exercises = payload.exercises as Array<Record<string, unknown>>;
    expect(exercises[0]?.day_note).toBe('Molestia leve');
  });
});

describe('setWorkoutNote (D-ideas-10)', () => {
  it('guarda la nota final del entreno y actualiza lastChangedAt', () => {
    const initial = workout();
    const updated = setWorkoutNote(initial, '  Gran entreno  ', '2026-11-20T11:00:00.000Z');
    expect(updated.note).toBe('Gran entreno');
    expect(updated.lastChangedAt).toBe('2026-11-20T11:00:00.000Z');
  });

  it('limita a 500 caracteres y vacío se guarda como null', () => {
    const long = setWorkoutNote(workout(), 'x'.repeat(600), '2026-11-20T11:00:00.000Z');
    expect(long.note).toHaveLength(500);
    const cleared = setWorkoutNote(long, '   ', '2026-11-20T11:05:00.000Z');
    expect(cleared.note).toBeNull();
  });

  it('se serializa en toSyncPayload como note', () => {
    const updated = setWorkoutNote(workout(), 'Energía alta', '2026-11-20T11:00:00.000Z');
    const payload = toSyncPayload(updated);
    expect(payload.note).toBe('Energía alta');
  });
});

describe('isWeightJump (D-120)', () => {
  it('detecta saltos mayores al 50 % respecto a la vez anterior', () => {
    // 35 kg -> 5.9 kg es una caída del 83.1 % (> 50 %)
    expect(isWeightJump(5.9, 35)).toBe(true);
    // 35 kg -> 60 kg es una subida del 71.4 % (> 50 %)
    expect(isWeightJump(60, 35)).toBe(true);
  });

  it('no avisa si el cambio es menor o igual al 50 %', () => {
    // 35 kg -> 37.5 kg es 7.1 % (<= 50 %)
    expect(isWeightJump(37.5, 35)).toBe(false);
    // 35 kg -> 52.5 kg es exactamente 50 %
    expect(isWeightJump(52.5, 35)).toBe(false);
    // 35 kg -> 17.5 kg es exactamente 50 %
    expect(isWeightJump(17.5, 35)).toBe(false);
  });

  it('si no hay valor previo o es cero, no salta aviso', () => {
    expect(isWeightJump(50, null)).toBe(false);
    expect(isWeightJump(50, 0)).toBe(false);
    expect(isWeightJump(50, -5)).toBe(false);
  });
});
