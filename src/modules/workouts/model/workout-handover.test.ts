import { describe, expect, it } from 'vitest';

import type { ActiveSet, ActiveWorkout } from './active-workout';
import { ownershipOf, takeOver } from './workout-handover';
import type { RemoteSet, RemoteWorkout } from './workout-handover';
import { TIMEOUT_AFTER_MS } from './workout-timers';

const T0 = '2026-11-16T08:00:00.000Z';
const NOW = Date.parse('2026-11-16T09:00:00.000Z');
const NONE: ReadonlySet<string> = new Set();

const values = {
  side: 'none' as const,
  weightKg: 40,
  reps: 8,
  durationSeconds: null,
  distanceMeters: null,
  intensityType: null,
  intensityValue: null,
  isExtra: false,
};

function remoteSet(setNumber: number, recordedAt: string, reps = 8): RemoteSet {
  return {
    ...values,
    id: `remote-${String(setNumber)}`,
    setNumber,
    reps,
    isDone: true,
    recordedAt,
  };
}

function localSet(setNumber: number, recordedAt: string | null, reps = 8): ActiveSet {
  return {
    ...values,
    id: `local-${String(setNumber)}`,
    setNumber,
    reps,
    isDone: recordedAt !== null,
    recordedAt,
  };
}

function remote(overrides: Partial<RemoteWorkout> = {}): RemoteWorkout {
  return {
    id: 'w1',
    tenantId: 'tenant-1',
    programId: 'program-1',
    blockId: 'block-1',
    programDayId: 'day-1',
    dayNumber: 1,
    startedAt: T0,
    lastChangedAt: '2026-11-16T08:30:00.000Z',
    openDeviceId: 'phone-a',
    deviceSince: T0,
    exercises: [
      {
        id: 'e1',
        position: 1,
        exerciseId: 'ex-1',
        programDayExerciseId: 'pde-1',
        supersetGroup: null,
        restSeconds: null,
        coachNote: null,
        prescribedSets: [{}, {}, {}],
        isSkipped: false,
        replacesExerciseId: null,
        changedAt: '2026-11-16T08:30:00.000Z',
        sets: [remoteSet(1, '2026-11-16T08:10:00.000Z'), remoteSet(2, '2026-11-16T08:30:00.000Z')],
      },
    ],
    ...overrides,
  };
}

function local(overrides: Partial<ActiveWorkout> = {}): ActiveWorkout {
  return {
    id: 'w1',
    tenantId: 'tenant-1',
    programId: 'program-1',
    blockId: 'block-1',
    programDayId: 'day-1',
    dayNumber: 1,
    startedAt: T0,
    lastChangedAt: '2026-11-16T08:40:00.000Z',
    closedAt: null,
    closeReason: null,
    deviceSince: null,
    lastExercise: 1,
    exercises: [
      {
        id: 'e1',
        position: 1,
        exerciseId: 'ex-1',
        programDayExerciseId: 'pde-1',
        measurement: 'weight_reps',
        isUnilateral: false,
        supersetGroup: null,
        restSeconds: null,
        coachNote: null,
        prescribedSets: [{}, {}, {}],
        isSkipped: false,
        replacesExerciseId: null,
        changedAt: '2026-11-16T08:40:00.000Z',
        sets: [
          localSet(1, '2026-11-16T08:40:00.000Z', 10),
          localSet(2, '2026-11-16T08:05:00.000Z', 3),
          localSet(3, null),
        ],
      },
    ],
    ...overrides,
  };
}

describe('ownershipOf', () => {
  it('sin entreno aquí, avisa del que está abierto en otro móvil', () => {
    expect(ownershipOf(null, [remote()], 'phone-b', NONE, NOW).kind).toBe('elsewhere');
  });

  it('el abierto en este mismo móvil, o sin móvil conocido, no molesta', () => {
    expect(ownershipOf(null, [remote()], 'phone-a', NONE, NOW).kind).toBe('free');
    const unknown = remote({ openDeviceId: null });
    expect(ownershipOf(null, [unknown], 'phone-b', NONE, NOW).kind).toBe('free');
  });

  it('lo que aquí aún está por subir (un cierre, un descarte) no cuenta', () => {
    expect(ownershipOf(null, [remote()], 'phone-b', new Set(['w1']), NOW).kind).toBe('free');
  });

  it('uno abandonado más de 12 horas no impide empezar otro', () => {
    const later = Date.parse('2026-11-16T08:30:00.000Z') + TIMEOUT_AFTER_MS;
    expect(ownershipOf(null, [remote()], 'phone-b', NONE, later).kind).toBe('free');
  });

  it('el de aquí queda tomado solo si otro móvil lo cogió después', () => {
    const taken = remote({ openDeviceId: 'phone-b', deviceSince: '2026-11-16T08:50:00.000Z' });
    expect(ownershipOf(local(), [taken], 'phone-a', NONE, NOW).kind).toBe('taken');
    const mine = local({ deviceSince: '2026-11-16T08:55:00.000Z' });
    expect(ownershipOf(mine, [taken], 'phone-a', NONE, NOW).kind).toBe('free');
  });
});

describe('takeOver', () => {
  const input = {
    exerciseInfo: () => ({ measurement: 'weight_reps' as const, isUnilateral: false }),
    now: '2026-11-16T09:00:00.000Z',
    newId: () => 'new-set',
  };

  it('sin nada aquí, trae lo de la nube y deja vacías las series sin tocar', () => {
    const taken = takeOver({ ...input, remote: remote(), local: null });
    expect(taken.exercises[0]?.sets.map((set) => set.isDone)).toEqual([true, true, false]);
    expect(taken.exercises[0]?.sets[2]?.id).toBe('new-set');
    expect(taken.deviceSince).toBe(input.now);
  });

  it('en cada serie se queda el último cambio (D-124)', () => {
    const taken = takeOver({ ...input, remote: remote(), local: local() });
    // Serie 1: la de aquí es más nueva. Serie 2: la de la nube.
    expect(taken.exercises[0]?.sets.map((set) => set.reps)).toEqual([10, 8, 8]);
    expect(taken.lastChangedAt).toBe('2026-11-16T08:40:00.000Z');
  });

  it('con el reloj atrasado, lo toma igualmente después del otro móvil', () => {
    const ahead = remote({ deviceSince: '2026-11-16T10:00:00.000Z' });
    expect(takeOver({ ...input, remote: ahead, local: null }).deviceSince).toBe(
      '2026-11-16T10:00:00.001Z',
    );
  });
});

describe('takeOver con lados, saltados y cambiados (PR 3.8)', () => {
  const info = {
    now: '2026-11-16T09:00:00.000Z',
    newId: () => 'new-set',
  };
  const oneSided = {
    ...info,
    exerciseInfo: () => ({ measurement: 'weight_reps' as const, isUnilateral: false }),
  };
  const bothSides = {
    ...info,
    exerciseInfo: () => ({ measurement: 'weight_reps' as const, isUnilateral: true }),
  };

  function withExercise(overrides: Partial<RemoteWorkout['exercises'][number]>): RemoteWorkout {
    const cloud = remote();
    const first = cloud.exercises[0];
    if (first === undefined) {
      throw new Error('fixture');
    }
    return { ...cloud, exercises: [{ ...first, ...overrides }] };
  }

  it('une cada serie por número y lado, y deja vacío el lado que falta', () => {
    const cloud = withExercise({
      prescribedSets: [{}, {}],
      sets: [{ ...remoteSet(1, '2026-11-16T08:10:00.000Z'), side: 'right' }],
    });
    const taken = takeOver({ ...bothSides, remote: cloud, local: null });
    expect(
      taken.exercises[0]?.sets.map((item) => [item.setNumber, item.side, item.isDone]),
    ).toEqual([
      [1, 'right', true],
      [1, 'left', false],
      [2, 'right', false],
      [2, 'left', false],
    ]);
  });

  it('lo de saltar lo decide el cambio más nuevo', () => {
    const cloud = withExercise({ isSkipped: true });
    // Aquí el cambio es más nuevo (08:40) y no estaba saltado.
    expect(takeOver({ ...oneSided, remote: cloud, local: local() }).exercises[0]?.isSkipped).toBe(
      false,
    );
    const older = local({
      exercises: local().exercises.map((exercise) => ({
        ...exercise,
        changedAt: '2026-11-16T08:00:00.000Z',
      })),
    });
    expect(takeOver({ ...oneSided, remote: cloud, local: older }).exercises[0]?.isSkipped).toBe(
      true,
    );
  });

  it('con otro ejercicio elegido más tarde, valen las series del elegido', () => {
    const cloud = withExercise({});
    const swapped = local({
      exercises: local().exercises.map((exercise) => ({
        ...exercise,
        exerciseId: 'ex-2',
        replacesExerciseId: 'ex-1',
      })),
    });
    const taken = takeOver({ ...oneSided, remote: cloud, local: swapped });
    expect(taken.exercises[0]).toMatchObject({ exerciseId: 'ex-2', replacesExerciseId: 'ex-1' });
    expect(taken.exercises[0]?.sets.map((item) => item.reps)).toEqual([10, 3, 8]);
  });
});
