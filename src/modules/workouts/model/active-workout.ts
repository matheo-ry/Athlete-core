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

/** Los unilaterales se apuntan por lado (D-121); el resto, sin lado. */
export const sideSchema = z.enum(['none', 'right', 'left']);

export type Side = z.infer<typeof sideSchema>;

const activeSetSchema = z.object({
  id: z.string(),
  setNumber: z.number().int().min(1).max(10),
  /** Lo guardado antes del PR 3.8 no trae lado: sin lado. */
  side: sideSchema.default('none'),
  weightKg: z.number().nullable(),
  reps: z.number().int().nullable(),
  durationSeconds: z.number().int().nullable(),
  distanceMeters: z.number().int().nullable(),
  intensityType: z.enum(['rir', 'rpe', 'failure']).nullable(),
  intensityValue: z.number().nullable(),
  isDone: z.boolean(),
  isExtra: z.boolean(),
  isWarmup: z.boolean().optional(),
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
  /** Nota del día que apunta el cliente al entrenar (D-122). */
  dayNote: z.string().nullable().default(null),
  /** Lo prescrito, tal cual, para que el historial no cambie si el coach edita la rutina. */
  prescribedSets: z.array(jsonSchema),
  /** "Saltar ejercicio" (D-122): no cuenta para cerrar el entreno. */
  isSkipped: z.boolean().default(false),
  /** El ejercicio de la rutina, si hoy se hizo otro en su lugar ("Cambiar ejercicio", D-122). */
  replacesExerciseId: z.string().nullable().default(null),
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
  /** Desde cuándo lo tiene este móvil, si lo tomó con "Seguir aquí" (D-124). */
  deviceSince: z.string().nullable().default(null),
  /** El último ejercicio que se tocó (D-119). */
  lastExercise: z.number().int().min(1),
  /** Nota final del entreno entero; dato de salud (D-ideas-10, D-126). */
  note: z.string().nullable().default(null),
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
  previousWarmupCount?: (exerciseId: string) => number;
  now: string;
  newId: () => string;
}

export function emptySet(
  id: string,
  setNumber: number,
  isExtra: boolean,
  side: Side = 'none',
  isWarmup = false,
): ActiveSet {
  return {
    id,
    setNumber,
    side,
    weightKg: null,
    reps: null,
    durationSeconds: null,
    distanceMeters: null,
    intensityType: null,
    intensityValue: null,
    isDone: false,
    isExtra,
    isWarmup,
    recordedAt: null,
  };
}

/** Los lados en que se apunta cada serie: derecha e izquierda en un unilateral (D-121). */
export function sidesOf(isUnilateral: boolean): readonly Side[] {
  return isUnilateral ? ['right', 'left'] : ['none'];
}

/** Series vacías numeradas desde 1, una por lado si es unilateral; las de `firstExtra` en adelante son extra. */
export function emptySets(
  isUnilateral: boolean,
  count: number,
  newId: () => string,
  firstExtra = Number.POSITIVE_INFINITY,
): ActiveSet[] {
  return Array.from({ length: count }, (_, index) =>
    sidesOf(isUnilateral).map((side) =>
      emptySet(newId(), index + 1, index + 1 >= firstExtra, side),
    ),
  ).flat();
}

/** Los números de serie efectiva de un ejercicio, sin repetir y en orden. */
export function setNumbers(exercise: Pick<ActiveExercise, 'sets'>): number[] {
  return [
    ...new Set(exercise.sets.filter((set) => !set.isWarmup).map((set) => set.setNumber)),
  ].sort((a, b) => a - b);
}

/** Máximo de series de calentamiento por ejercicio (D-ideas-2). */
export const MAX_WARMUP_SETS = 5;

/** Las series de calentamiento de un ejercicio, ordenadas. */
export function warmupSets(exercise: Pick<ActiveExercise, 'sets'>): ActiveSet[] {
  return exercise.sets
    .filter((set) => Boolean(set.isWarmup))
    .sort((a, b) => a.setNumber - b.setNumber);
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
    deviceSince: null,
    lastExercise: 1,
    note: null,
    exercises: day.exercises.map((item, index) => {
      const info = input.exerciseInfo(item.exerciseId);
      const warmupCount = Math.min(
        MAX_WARMUP_SETS,
        Math.max(0, input.previousWarmupCount?.(item.exerciseId) ?? 0),
      );
      const warmups = Array.from({ length: warmupCount }, (_, wIndex) =>
        emptySet(newId(), wIndex + 1, false, 'none', true),
      );
      return {
        id: newId(),
        position: index + 1,
        exerciseId: item.exerciseId,
        programDayExerciseId: item.id,
        ...info,
        supersetGroup: item.supersetGroup,
        restSeconds: item.restSeconds,
        coachNote: item.note,
        dayNote: null,
        prescribedSets: item.sets,
        isSkipped: false,
        replacesExerciseId: null,
        changedAt: now,
        sets: [...warmups, ...emptySets(info.isUnilateral, item.sets.length, newId)],
      };
    }),
  };
}

export type SetPatch = Partial<
  Pick<
    ActiveSet,
    'weightKg' | 'reps' | 'durationSeconds' | 'distanceMeters' | 'intensityType' | 'intensityValue'
  >
>;

/** Cambia un ejercicio del entreno y apunta cuándo, para el cierre y la subida (D-119). */
export function withExercise(
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

/**
 * Cambiar un dato de una serie la ilumina: queda hecha, sin botón (D-120). En
 * un unilateral, `side` es el lado que se toca.
 */
export function changeSet(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  patch: SetPatch,
  now: string,
  side: Side = 'none',
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) =>
      !set.isWarmup && set.setNumber === setNumber && set.side === side
        ? { ...set, ...patch, isDone: true, recordedAt: now }
        : set,
    ),
  }));
}

/**
 * Nota del día en cada ejercicio del entreno (D-122).
 * Hasta 500 caracteres; vacío se guarda como null.
 */
export function setDayNote(
  workout: ActiveWorkout,
  position: number,
  note: string | null,
  now: string,
): ActiveWorkout {
  const trimmed = note === null ? null : note.trim();
  const value = trimmed === '' || trimmed === null ? null : trimmed.slice(0, 500);
  return withExercise(workout, position, now, (exercise) => ({
    ...exercise,
    dayNote: value,
  }));
}

/**
 * Nota final del entreno entero (D-ideas-10).
 * Hasta 500 caracteres; vacío se guarda como null.
 */
export function setWorkoutNote(
  workout: ActiveWorkout,
  note: string | null,
  now: string,
): ActiveWorkout {
  const trimmed = note === null ? null : note.trim();
  const value = trimmed === '' || trimmed === null ? null : trimmed.slice(0, 500);
  return {
    ...workout,
    note: value,
    lastChangedAt:
      Date.parse(now) > Date.parse(workout.lastChangedAt) ? now : workout.lastChangedAt,
  };
}

/**
 * "¿Seguro?": avisa si el peso cambia más de un 50 % respecto a la vez anterior (D-120).
 * Compara |actual - anterior| / anterior > 0.5. Si no hay anterior o es <= 0, no aplica.
 */
export function isWeightJump(currentKg: number, previousKg: number | null): boolean {
  if (previousKg === null || previousKg <= 0) {
    return false;
  }
  return Math.abs(currentKg - previousKg) / previousKg > 0.5;
}

/**
 * Series hechas y totales: de un ejercicio, o de todo el entreno. Un
 * unilateral cuenta una serie cuando están hechos los dos lados (D-121), y un
 * ejercicio saltado no cuenta (D-122).
 */
export function setCounts(exercises: readonly ActiveExercise[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const exercise of exercises) {
    if (exercise.isSkipped) {
      continue;
    }
    for (const number of setNumbers(exercise)) {
      total += 1;
      const sets = exercise.sets.filter((set) => !set.isWarmup && set.setNumber === number);
      done += sets.every((set) => set.isDone) ? 1 : 0;
    }
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
export function toSyncPayload(
  workout: ActiveWorkout,
  deviceId: string | null = null,
): { [key: string]: JsonValue } {
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
    device_id: deviceId,
    device_since: workout.deviceSince ?? workout.startedAt,
    note: workout.note,
    exercises: workout.exercises.map((exercise) => ({
      id: exercise.id,
      position: exercise.position,
      exercise_id: exercise.exerciseId,
      program_day_exercise_id: exercise.programDayExerciseId,
      superset_group: exercise.supersetGroup,
      prescribed_sets: exercise.prescribedSets,
      prescribed_rest_seconds: exercise.restSeconds,
      coach_note: exercise.coachNote,
      day_note: exercise.dayNote,
      is_skipped: exercise.isSkipped,
      replaces_exercise_id: exercise.replacesExerciseId,
      changed_at: exercise.changedAt,
      // Un ejercicio saltado no sube series; al deshacerlo, vuelven con su fecha.
      sets: exercise.isSkipped
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
    side: set.isWarmup ? 'none' : set.side,
    // Solo lo que casa con la forma de medir (D-072): la base de datos rechaza el resto.
    weight_kg: byWeight ? set.weightKg : null,
    reps: byWeight ? set.reps : null,
    duration_seconds: exercise.measurement === 'time' ? set.durationSeconds : null,
    distance_meters: exercise.measurement === 'distance' ? set.distanceMeters : null,
    intensity_type: set.isWarmup ? null : set.intensityType,
    intensity_value: set.isWarmup || set.intensityType === 'failure' ? null : set.intensityValue,
    is_extra: set.isWarmup ? false : set.isExtra,
    is_warmup: Boolean(set.isWarmup),
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
    // La carga prescrita es del ejercicio de la rutina: no vale para el que lo sustituye (D-122).
    weightKg: exercise.replacesExerciseId === null ? set.targetLoadKg : null,
    // Con un rango ("8-12"), el tope: es a lo que se apunta.
    reps: set.repsMax ?? set.repsMin,
    durationSeconds: set.durationSeconds,
    distanceMeters: set.distanceMeters,
    intensityValue: set.intensityValue,
  };
}

/**
 * Tocar una serie iluminada la apaga (D-120), con sus dos lados si es
 * unilateral. Lo escrito se queda, pero no cuenta.
 */
export function unmarkSet(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  now: string,
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) =>
      !set.isWarmup && set.setNumber === setNumber
        ? { ...set, isDone: false, recordedAt: now }
        : set,
    ),
  }));
}

/** "+ Calentamiento" (D-ideas-2): añade una serie de calentamiento (máximo 5, sin lado ni intensidad). */
export function addWarmupSet(
  workout: ActiveWorkout,
  position: number,
  now: string,
  newId: () => string,
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) => {
    const warmups = warmupSets(exercise);
    if (warmups.length >= MAX_WARMUP_SETS) {
      return exercise;
    }
    const nextNumber = (warmups.at(-1)?.setNumber ?? 0) + 1;
    if (nextNumber > MAX_WARMUP_SETS) {
      return exercise;
    }
    return {
      ...exercise,
      sets: [emptySet(newId(), nextNumber, false, 'none', true), ...exercise.sets],
    };
  });
}

/** Cambia una serie de calentamiento y la marca como hecha (sin intensidad ni lado, D-ideas-2). */
export function changeWarmupSet(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  patch: Pick<SetPatch, 'weightKg' | 'reps' | 'durationSeconds' | 'distanceMeters'>,
  now: string,
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) =>
      set.isWarmup && set.setNumber === setNumber
        ? { ...set, ...patch, isDone: true, recordedAt: now }
        : set,
    ),
  }));
}

/** Quita o desmarca una serie de calentamiento (D-ideas-2). */
export function removeWarmupSet(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  now: string,
): ActiveWorkout {
  return withExercise(workout, position, now, (exercise) => {
    const target = exercise.sets.find((set) => set.isWarmup && set.setNumber === setNumber);
    if (target === undefined) {
      return exercise;
    }
    if (target.recordedAt !== null) {
      return {
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.id === target.id ? { ...set, isDone: false, recordedAt: now } : set,
        ),
      };
    }
    let nextNum = 1;
    const updatedSets: ActiveSet[] = [];
    for (const set of exercise.sets) {
      if (set.id === target.id) {
        continue;
      }
      if (set.isWarmup) {
        updatedSets.push({ ...set, setNumber: nextNum });
        nextNum += 1;
      } else {
        updatedSets.push(set);
      }
    }
    return { ...exercise, sets: updatedSets };
  });
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
  return withExercise(workout, position, now, (exercise) => {
    const count = setNumbers(exercise).length;
    return count >= MAX_SETS
      ? exercise
      : {
          ...exercise,
          sets: [
            ...exercise.sets,
            ...sidesOf(exercise.isUnilateral).map((side) =>
              emptySet(newId(), count + 1, true, side),
            ),
          ],
        };
  });
}

/** Una serie de la vez anterior (en un unilateral, un lado). */
export interface PreviousSetValues {
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  intensityType: 'rir' | 'rpe' | 'failure' | null;
  intensityValue: number | null;
}

/** La serie con ese número (y lado) de la vez anterior; `null` si entonces no la hizo. */
export function previousSet(
  previous: {
    sets: readonly (PreviousSetValues & { setNumber: number; side: string; isWarmup?: boolean })[];
  } | null,
  setNumber: number,
  side: Side = 'none',
): PreviousSetValues | null {
  const set = previous?.sets.find(
    (item) => !item.isWarmup && item.setNumber === setNumber && item.side === side,
  );
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

/** Serie de calentamiento `setNumber` de la vez anterior (D-ideas-2). */
export function previousWarmupSet(
  previous: {
    sets: readonly (PreviousSetValues & { setNumber: number; side: string; isWarmup?: boolean })[];
  } | null,
  setNumber: number,
): PreviousSetValues | null {
  const set = previous?.sets.find(
    (item) => item.isWarmup === true && item.setNumber === setNumber && item.side === 'none',
  );
  return set === undefined
    ? null
    : {
        weightKg: set.weightKg,
        reps: set.reps,
        durationSeconds: set.durationSeconds,
        distanceMeters: set.distanceMeters,
        intensityType: null,
        intensityValue: null,
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

/** "Igual" en un unilateral (D-121): copia cada lado que tenga algo que copiar. */
export function copySides(
  workout: ActiveWorkout,
  position: number,
  setNumber: number,
  sources: Partial<Record<Side, PreviousSetValues | null>>,
  now: string,
): ActiveWorkout {
  let result = workout;
  for (const side of ['none', 'right', 'left'] as const) {
    const source = sources[side];
    if (source !== undefined && source !== null) {
      result = changeSet(result, position, setNumber, source, now, side);
    }
  }
  return result;
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
    const exercise = workout.exercises[position - 1];
    if (
      exercise !== undefined &&
      !exercise.isSkipped &&
      exercise.sets.some((set) => !set.isWarmup && !set.isDone)
    ) {
      return position;
    }
  }
  return null;
}

/**
 * Lo que copia "Igual" (D-120). Por defecto, la vez anterior en esa serie. Con
 * el ajuste `previous_then_today` (Perfil → "Entreno"), la serie 1 copia la vez
 * anterior y las siguientes, la serie anterior de hoy si ya está hecha.
 */
export function copySource(
  mode: 'previous' | 'previous_then_today',
  exercise: ActiveExercise,
  setNumber: number,
  previous: PreviousSetValues | null,
  side: Side = 'none',
): PreviousSetValues | null {
  if (mode === 'previous' || setNumber === 1) {
    return previous;
  }
  const before = exercise.sets.find(
    (set) => !set.isWarmup && set.setNumber === setNumber - 1 && set.side === side,
  );
  if (before === undefined || !before.isDone) {
    return null;
  }
  return {
    weightKg: before.weightKg,
    reps: before.reps,
    durationSeconds: before.durationSeconds,
    distanceMeters: before.distanceMeters,
    intensityType: before.intensityType,
    intensityValue: before.intensityValue,
  };
}
