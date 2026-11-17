// Lógica pura de la actividad de los entrenos para el coach (PR 3.14, D-114, D-128).

export const OPENED_WORKOUTS_STORAGE_KEY = 'athlete_core.opened_workouts';

export interface ActivitySet {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  intensityType: string | null;
  intensityValue: number | null;
  isDone: boolean;
}

export interface ActivityExercise {
  id: string;
  exerciseId: string;
  replacesExerciseId: string | null;
  dayNote: string | null;
  isSkipped: boolean;
  sets: readonly ActivitySet[];
}

export interface WorkoutActivityRecord {
  id: string;
  clientId: string;
  performedOn: string;
  dayNumber: number;
  dayName: string | null;
  exercises: readonly ActivityExercise[];
}

/**
 * RM estimado con la fórmula de Epley (D-129): peso × (1 + repeticiones ÷ 30).
 * Con RIR, se suma a las repeticiones; con RPE, RIR = 10 − RPE.
 * No se calcula con más de 12 repeticiones (contando el RIR), porque deja de ser fiable.
 */
export function calculateEstimatedRm(
  weightKg: number | null,
  reps: number | null,
  intensityType?: string | null,
  intensityValue?: number | null,
): number | null {
  if (weightKg === null || weightKg <= 0 || reps === null || reps <= 0) {
    return null;
  }
  let totalReps = reps;
  if (intensityType === 'rir' && intensityValue !== null && intensityValue !== undefined) {
    totalReps += intensityValue;
  } else if (intensityType === 'rpe' && intensityValue !== null && intensityValue !== undefined) {
    totalReps += 10 - intensityValue;
  }
  if (totalReps > 12) {
    return null;
  }
  return weightKg * (1 + totalReps / 30);
}

/**
 * Cuenta cuántos ejercicios de un entreno han batido un récord (peso máximo o RM estimado)
 * frente a los entrenos anteriores del mismo cliente para ese ejercicio (D-128, D-129).
 */
export function countRecords(
  workout: WorkoutActivityRecord,
  priorWorkouts: readonly WorkoutActivityRecord[],
): number {
  let recordsCount = 0;

  for (const exercise of workout.exercises) {
    if (exercise.isSkipped) {
      continue;
    }
    const doneSets = exercise.sets.filter((s) => s.isDone);
    if (doneSets.length === 0) {
      continue;
    }

    const maxWeight = Math.max(0, ...doneSets.map((s) => s.weightKg ?? 0));
    const maxRm = Math.max(
      0,
      ...doneSets.map(
        (s) => calculateEstimatedRm(s.weightKg, s.reps, s.intensityType, s.intensityValue) ?? 0,
      ),
    );

    // Buscar si el cliente ya había hecho este ejercicio en entrenos anteriores.
    let hadPrior = false;
    let priorMaxWeight = 0;
    let priorMaxRm = 0;

    for (const prior of priorWorkouts) {
      for (const priorEx of prior.exercises) {
        if (priorEx.exerciseId === exercise.exerciseId && !priorEx.isSkipped) {
          const priorDoneSets = priorEx.sets.filter((s) => s.isDone);
          if (priorDoneSets.length > 0) {
            hadPrior = true;
            const w = Math.max(0, ...priorDoneSets.map((s) => s.weightKg ?? 0));
            const rm = Math.max(
              0,
              ...priorDoneSets.map(
                (s) =>
                  calculateEstimatedRm(s.weightKg, s.reps, s.intensityType, s.intensityValue) ?? 0,
              ),
            );
            if (w > priorMaxWeight) priorMaxWeight = w;
            if (rm > priorMaxRm) priorMaxRm = rm;
          }
        }
      }
    }

    if (hadPrior && (maxWeight > priorMaxWeight || maxRm > priorMaxRm)) {
      recordsCount += 1;
    }
  }

  return recordsCount;
}

/** Cuántos ejercicios del entreno se cambiaron por otro (replaces_exercise_id not null). */
export function countReplacements(workout: WorkoutActivityRecord): number {
  return workout.exercises.filter((e) => e.replacesExerciseId !== null).length;
}

/** Cuántos ejercicios del entreno tienen nota del día del cliente. */
export function countNotes(workout: WorkoutActivityRecord): number {
  return workout.exercises.filter((e) => e.dayNote !== null && e.dayNote.trim().length > 0).length;
}

/** Identificadores de entrenos ya abiertos en este dispositivo. */
export function getOpenedWorkoutIds(storage: Pick<Storage, 'getItem'> = localStorage): Set<string> {
  try {
    const raw = storage.getItem(OPENED_WORKOUTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const ids = parsed.filter((item): item is string => typeof item === 'string');
    return new Set(ids);
  } catch {
    return new Set();
  }
}

/** Marca un entreno como abierto en este dispositivo. */
export function markWorkoutOpened(
  workoutId: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): void {
  try {
    const set = getOpenedWorkoutIds(storage);
    set.add(workoutId);
    storage.setItem(OPENED_WORKOUTS_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Si localStorage está bloqueado o da error, no rompemos la navegación.
  }
}
