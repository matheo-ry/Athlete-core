import { z } from 'zod';

import type { Measurement } from '@/modules/exercises';
import { localToday } from '@/modules/programs';
import type { ProgramBlock, ProgramDay } from '@/modules/programs';

// El entreno abierto, tal como vive en el móvil mientras se entrena (D-118,
// D-119, D-120). Cada cambio se guarda al instante y va a la cola de subida
// con `sync_workout` (D-138). Lógica pura.

const jsonSchema = z.json();

/** Un valor que se puede pasar a JSON: lo que acepta la cola de subida. */
export type JsonValue = z.infer<typeof jsonSchema>;

const activeSetSchema = z.object({
  id: z.string(),
  setNumber: z.number().int().min(1).max(10),
  weightKg: z.number().nullable(),
  reps: z.number().int().nullable(),
  durationSeconds: z.number().int().nullable(),
  distanceMeters: z.number().int().nullable(),
  intensityType: z.enum(['rir', 'rpe', 'failure']).nullable(),
  intensityValue: z.number().nullable(),
  isDone: z.boolean(),
  isExtra: z.boolean(),
  /** Vacío = no se ha tocado: no se sube. */
  recordedAt: z.string().nullable(),
});

export type ActiveSet = z.infer<typeof activeSetSchema>;

const activeExerciseSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1),
  exerciseId: z.string(),
  programDayExerciseId: z.string().nullable(),
  measurement: z.enum(['weight_reps', 'bodyweight_reps', 'time', 'distance']),
  isUnilateral: z.boolean(),
  supersetGroup: z.number().int().nullable(),
  restSeconds: z.number().int().nullable(),
  coachNote: z.string().nullable(),
  /** Lo prescrito, tal cual, para que el historial no cambie si el coach edita la rutina. */
  prescribedSets: z.array(jsonSchema),
  changedAt: z.string(),
  sets: z.array(activeSetSchema),
});

export type ActiveExercise = z.infer<typeof activeExerciseSchema>;

export const activeWorkoutSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  programId: z.string(),
  blockId: z.string().nullable(),
  programDayId: z.string().nullable(),
  dayNumber: z.number().int().min(1),
  startedAt: z.string(),
  lastChangedAt: z.string(),
  /** Vacío mientras está abierto. */
  closedAt: z.string().nullable(),
  /** Por qué se cerró (D-119); los guardados antes del PR 3.6 no lo traen. */
  closeReason: z.enum(['manual', 'completed', 'timeout']).nullable().default(null),
  /** El último ejercicio que se tocó (D-119). */
  lastExercise: z.number().int().min(1),
  exercises: z.array(activeExerciseSchema),
});

export type ActiveWorkout = z.infer<typeof activeWorkoutSchema>;

export interface ExerciseInfo {
  measurement: Measurement;
  isUnilateral: boolean;
}

export interface StartInput {
  tenantId: string;
  programId: string;
  block: ProgramBlock;
  day: ProgramDay;
  exerciseInfo: (exerciseId: string) => ExerciseInfo;
  now: string;
  newId: () => string;
}

function emptySet(id: string, setNumber: number, isExtra: boolean): ActiveSet {
  return {
    id,
    setNumber,
    weightKg: null,
    reps: null,
    durationSeconds: null,
    distanceMeters: null,
    intensityType: null,
    intensityValue: null,
    isDone: false,
    isExtra,
    recordedAt: null,
  };
}

/** Un entreno nuevo del día, con sus series prescritas vacías (D-119). */
export function startWorkout(input: StartInput): ActiveWorkout {
  const { day, now, newId } = input;
  return {
    id: newId(),
    tenantId: input.tenantId,
    programId: input.programId,
    blockId: input.block.id,
    programDayId: day.id,
    dayNumber: day.dayNumber,
    startedAt: now,
    lastChangedAt: now,
    closedAt: null,
    closeReason: null,
    lastExercise: 1,
    exercises: day.exercises.map((item, index) => ({
      id: newId(),
      position: index + 1,
      exerciseId: item.exerciseId,
      programDayExerciseId: item.id,
      ...input.exerciseInfo(item.exerciseId),
      supersetGroup: item.supersetGroup,
      restSeconds: item.restSeconds,
      coachNote: item.note,
      prescribedSets: item.sets,
      changedAt: now,
      sets: item.sets.map((_, setIndex) => emptySet(newId(), setIndex + 1, false)),
    })),
  };
}

export type SetPatch = Partial<
  Pick<
    ActiveSet,
    'weightKg' | 'reps' | 'durationSeconds' | 'distanceMeters' | 'intensityType' | 'intensityValue'
  >
>;

function withExercise(
  workout: ActiveWorkout,
  position: number,
  now: string,
  change: (exercise: ActiveExercise) => ActiveExercise,
): ActiveWorkout {
  return {
    ...workout,
    lastChangedAt: now,
    lastExercise: position,
    exercises: workout.exercises.map((exercise) =>
      exercise.position === position ? { ...change(exercise), changedAt: now } : exercise,
    ),
  };
}

/** Cambiar un dato de una serie la ilumina: queda hecha, sin botón (D-120). */
export function changeSet(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  patch: SetPatch,
  now: string,
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) =>
      set.setNumber === setNumber ? { ...set, ...patch, isDone: true, recordedAt: now } : set,
    ),
  }));
}

/** Series hechas y totales: de un ejercicio, o de todo el entreno. */
export function setCounts(exercises: readonly ActiveExercise[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const exercise of exercises) {
    total += exercise.sets.length;
    done += exercise.sets.filter((set) => set.isDone).length;
  }
  return { done, total };
}

/** Pasos de los botones − y + (D-120); segundos y metros, D-146. */
export const STEPS = {
  kg: 2.5,
  lb: 5,
  reps: 1,
  rir: 1,
  rpe: 0.5,
  seconds: 5,
  meters: 10,
} as const;

/** Un paso arriba o abajo, nunca por debajo de 0 ni por encima de `max`. */
export function stepValue(value: number, step: number, direction: 1 | -1, max: number): number {
  const next = Math.round((value + step * direction) / step) * step;
  return Math.min(max, Math.max(0, Number(next.toFixed(2))));
}

export type CloseReason = NonNullable<ActiveWorkout['closeReason']>;

/**
 * Cierra el entreno (D-119): a mano, porque está todo hecho o por tiempo. No
 * toca `lastChangedAt`: la fecha sigue siendo la del último dato cambiado.
 */
export function finishWorkout(
  workout: ActiveWorkout,
  now: string,
  reason: CloseReason = 'manual',
): ActiveWorkout {
  return { ...workout, closedAt: now, closeReason: reason };
}

/** Lo que espera `sync_workout` (migración 18). */
export function toSyncPayload(workout: ActiveWorkout): { [key: string]: JsonValue } {
  return {
    id: workout.id,
    program_id: workout.programId,
    block_id: workout.blockId,
    program_day_id: workout.programDayId,
    day_number: workout.dayNumber,
    // La fecha del entreno es la del último dato cambiado, en la zona del móvil (D-119).
    performed_on: localToday(new Date(workout.lastChangedAt)),
    started_at: workout.startedAt,
    last_changed_at: workout.lastChangedAt,
    closed_at: workout.closedAt,
    close_reason: workout.closedAt === null ? null : (workout.closeReason ?? 'manual'),
    device_since: workout.startedAt,
    exercises: workout.exercises.map((exercise) => ({
      id: exercise.id,
      position: exercise.position,
      exercise_id: exercise.exerciseId,
      program_day_exercise_id: exercise.programDayExerciseId,
      superset_group: exercise.supersetGroup,
      prescribed_sets: exercise.prescribedSets,
      prescribed_rest_seconds: exercise.restSeconds,
      coach_note: exercise.coachNote,
      is_skipped: false,
      changed_at: exercise.changedAt,
      // Los unilaterales se apuntan por lado desde el PR 3.8 (D-146).
      sets: exercise.isUnilateral
        ? []
        : exercise.sets
            .filter((set) => set.recordedAt !== null)
            .map((set) => setPayload(exercise, set)),
    })),
  };
}

function setPayload(exercise: ActiveExercise, set: ActiveSet): { [key: string]: JsonValue } {
  const byWeight =
    exercise.measurement === 'weight_reps' || exercise.measurement === 'bodyweight_reps';
  return {
    id: set.id,
    set_number: set.setNumber,
    side: 'none',
    // Solo lo que casa con la forma de medir (D-072): la base de datos rechaza el resto.
    weight_kg: byWeight ? set.weightKg : null,
    reps: byWeight ? set.reps : null,
    duration_seconds: exercise.measurement === 'time' ? set.durationSeconds : null,
    distance_meters: exercise.measurement === 'distance' ? set.distanceMeters : null,
    intensity_type: set.intensityType,
    intensity_value: set.intensityType === 'failure' ? null : set.intensityValue,
    is_extra: set.isExtra,
    is_done: set.isDone,
    recorded_at: set.recordedAt,
  };
}

const prescribedSetSchema = z.object({
  repsMin: z.number().nullable(),
  repsMax: z.number().nullable(),
  durationSeconds: z.number().nullable(),
  distanceMeters: z.number().nullable(),
  intensityValue: z.number().nullable(),
  targetLoadKg: z.number().nullable(),
});

export interface Reference {
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  intensityValue: number | null;
}

/** Lo prescrito por el coach en una serie, de referencia mientras no se apunta nada (D-120). */
export function prescribedReference(exercise: ActiveExercise, setNumber: number): Reference | null {
  const parsed = prescribedSetSchema.safeParse(exercise.prescribedSets[setNumber - 1]);
  if (!parsed.success) {
    return null;
  }
  const set = parsed.data;
  return {
    weightKg: set.targetLoadKg,
    // Con un rango ("8-12"), el tope: es a lo que se apunta.
    reps: set.repsMax ?? set.repsMin,
    durationSeconds: set.durationSeconds,
    distanceMeters: set.distanceMeters,
    intensityValue: set.intensityValue,
  };
}

/** Tocar una serie iluminada la apaga (D-120). Lo escrito se queda, pero no cuenta. */
export function unmarkSet(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  now: string,
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) =>
      set.setNumber === setNumber ? { ...set, isDone: false, recordedAt: now } : set,
    ),
  }));
}

/** Como mucho 10 series por ejercicio (D-086). */
export const MAX_SETS = 10;

/** "+ Serie" (D-120): una más que las prescritas, vacía, hasta 10. */
export function addSet(
  workout: ActiveWorkout,
  position: number,
  now: string,
  newId: () => string,
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) =>
    exercise.sets.length >= MAX_SETS
      ? exercise
      : {
          ...exercise,
          sets: [...exercise.sets, emptySet(newId(), exercise.sets.length + 1, true)],
        },
  );
}

/** Una serie de la vez anterior (sin lado, D-121 llega en el PR 3.8). */
export interface PreviousSetValues {
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  intensityType: 'rir' | 'rpe' | 'failure' | null;
  intensityValue: number | null;
}

/** La serie con ese número de la vez anterior; `null` si entonces no la hizo. */
export function previousSet(
  previous: { sets: readonly (PreviousSetValues & { setNumber: number; side: string })[] } | null,
  setNumber: number,
): PreviousSetValues | null {
  const set = previous?.sets.find((item) => item.setNumber === setNumber && item.side === 'none');
  return set === undefined
    ? null
    : {
        weightKg: set.weightKg,
        reps: set.reps,
        durationSeconds: set.durationSeconds,
        distanceMeters: set.distanceMeters,
        intensityType: set.intensityType,
        intensityValue: set.intensityValue,
      };
}

/** "Igual" (D-120, forma por defecto): copia lo gris, la vez anterior en esa serie, y la ilumina. */
export function copyPrevious(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  previous: PreviousSetValues,
  now: string,
): ActiveWorkout {
  return changeSet(workout, position, setNumber, previous, now);
}

/**
 * El ejercicio que toca al abrir la app (D-119): el último que se tocó si le
 * quedan series; si no, el siguiente con series pendientes (dando la vuelta);
 * `null` si ya no queda nada (se va al resumen).
 */
export function exerciseToResume(workout: ActiveWorkout): number | null {
  const count = workout.exercises.length;
  for (let offset = 0; offset < count; offset += 1) {
    const position = ((workout.lastExercise - 1 + offset) % count) + 1;
    if (workout.exercises[position - 1]?.sets.some((set) => !set.isDone) === true) {
      return position;
    }
  }
  return null;
}
