import { emptySet, sidesOf } from './active-workout';
import type { ActiveExercise, ActiveSet, ActiveWorkout, ExerciseInfo } from './active-workout';
import { isTimedOut } from './workout-timers';

// Un entreno abierto vive en un solo móvil (D-124, D-152). Lógica pura: de
// quién es y cómo se toma con "Seguir aquí".

export type RemoteSet = Omit<ActiveSet, 'recordedAt'> & { recordedAt: string };

export type RemoteExercise = Omit<ActiveExercise, 'measurement' | 'isUnilateral' | 'sets'> & {
  sets: RemoteSet[];
};

export interface RemoteWorkout {
  id: string;
  tenantId: string;
  programId: string | null;
  blockId: string | null;
  programDayId: string | null;
  dayNumber: number;
  startedAt: string;
  lastChangedAt: string;
  openDeviceId: string | null;
  deviceSince: string | null;
  exercises: RemoteExercise[];
}

export type Ownership =
  | { kind: 'free' }
  /** Sin entreno aquí, y hay uno abierto en otro móvil. */
  | { kind: 'elsewhere'; remote: RemoteWorkout }
  /** El de aquí lo tomó otro móvil después. */
  | { kind: 'taken'; remote: RemoteWorkout };

export const FREE: Ownership = { kind: 'free' };

function inOtherDevice(remote: RemoteWorkout, deviceId: string): boolean {
  return remote.openDeviceId !== null && remote.openDeviceId !== deviceId;
}

export function ownershipOf(
  local: ActiveWorkout | null,
  remotes: readonly RemoteWorkout[],
  deviceId: string,
  pendingIds: ReadonlySet<string>,
  nowMs: number,
): Ownership {
  if (local !== null) {
    const remote = remotes.find((item) => item.id === local.id);
    return remote !== undefined &&
      remote.deviceSince !== null &&
      inOtherDevice(remote, deviceId) &&
      Date.parse(remote.deviceSince) > Date.parse(local.deviceSince ?? local.startedAt)
      ? { kind: 'taken', remote }
      : FREE;
  }
  const remote = remotes.find(
    (item) =>
      inOtherDevice(item, deviceId) &&
      item.programId !== null &&
      // Lo que este móvil aún tiene por subir (un cierre, un descarte) ya no está abierto.
      !pendingIds.has(item.id) &&
      // Pasadas 12 horas está abandonado: no impide empezar otro (D-152).
      !isTimedOut(item.lastChangedAt, nowMs),
  );
  return remote === undefined ? FREE : { kind: 'elsewhere', remote };
}

function newest(a: string, b: string): string {
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

/**
 * Cada serie, con su último cambio (D-124), por número y lado (D-121). Las que
 * nadie tocó quedan vacías.
 */
function mergeSets(
  prescribedCount: number,
  isUnilateral: boolean,
  remote: readonly RemoteSet[],
  local: readonly ActiveSet[],
  newId: () => string,
): ActiveSet[] {
  const numbers = new Set([
    ...Array.from({ length: prescribedCount }, (_, index) => index + 1),
    ...remote.map((set) => set.setNumber),
    ...local.map((set) => set.setNumber),
  ]);
  return [...numbers]
    .sort((a, b) => a - b)
    .flatMap((setNumber) =>
      sidesOf(isUnilateral).map((side) => {
        const there = remote.find((set) => set.setNumber === setNumber && set.side === side);
        const here = local.find((set) => set.setNumber === setNumber && set.side === side);
        if (there === undefined) {
          return here ?? emptySet(newId(), setNumber, setNumber > prescribedCount, side);
        }
        const hereAt = here?.recordedAt ?? null;
        return here !== undefined && hereAt !== null && newest(hereAt, there.recordedAt) === hereAt
          ? here
          : there;
      }),
    );
}

export interface TakeOverInput {
  remote: RemoteWorkout;
  local: ActiveWorkout | null;
  exerciseInfo: (exerciseId: string) => ExerciseInfo;
  now: string;
  newId: () => string;
}

/**
 * "Seguir aquí": el entreno de la nube, con lo de este móvil si es más nuevo.
 * Siempre después de quien lo tenía, aunque este reloj vaya atrasado (D-138).
 */
export function takeOver(input: TakeOverInput): ActiveWorkout {
  const { remote, local, now, newId } = input;
  const exercises = [...remote.exercises]
    .sort((a, b) => a.position - b.position)
    .map((exercise): ActiveExercise => {
      const here = local?.exercises.find((item) => item.id === exercise.id);
      const { sets, ...rest } = exercise;
      // Saltar y cambiar de ejercicio los decide el cambio más nuevo, como las series.
      const newer =
        here !== undefined && Date.parse(here.changedAt) > Date.parse(exercise.changedAt);
      const chosen = newer ? here : exercise;
      const info = input.exerciseInfo(chosen.exerciseId);
      const swapped = here !== undefined && here.exerciseId !== exercise.exerciseId;
      return {
        ...rest,
        ...info,
        exerciseId: chosen.exerciseId,
        isSkipped: chosen.isSkipped,
        replacesExerciseId: chosen.replacesExerciseId,
        changedAt: newest(exercise.changedAt, here?.changedAt ?? exercise.changedAt),
        // Con otro ejercicio, las series de uno y otro no se mezclan: valen las del elegido.
        sets: mergeSets(
          exercise.prescribedSets.length,
          info.isUnilateral,
          swapped && newer ? [] : sets,
          swapped && !newer ? [] : (here?.sets ?? []),
          newId,
        ),
      };
    });
  const latest = exercises.reduce<ActiveExercise | undefined>(
    (best, item) =>
      best === undefined || Date.parse(item.changedAt) > Date.parse(best.changedAt) ? item : best,
    undefined,
  );
  const after = Date.parse(remote.deviceSince ?? remote.startedAt) + 1;
  return {
    id: remote.id,
    tenantId: remote.tenantId,
    programId: remote.programId ?? local?.programId ?? '',
    blockId: remote.blockId,
    programDayId: remote.programDayId,
    dayNumber: remote.dayNumber,
    startedAt: remote.startedAt,
    lastChangedAt: newest(remote.lastChangedAt, local?.lastChangedAt ?? remote.lastChangedAt),
    closedAt: null,
    closeReason: null,
    deviceSince: new Date(Math.max(Date.parse(now), after)).toISOString(),
    lastExercise: latest?.position ?? 1,
    exercises,
  };
}
