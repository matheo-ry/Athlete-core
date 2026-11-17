// Lógica pura de la actividad de los entrenos para el coach (PR 3.14, D-114, D-128).

import { computeExerciseRecords } from './records';
import type { SetWithRecordInput } from './records';

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

function toRecordInputs(sets: readonly ActivitySet[]): SetWithRecordInput[] {
  return sets.map((set) => ({
    weightKg: set.weightKg,
    reps: set.reps,
    intensityType: set.intensityType,
    intensityValue: set.intensityValue,
    isDone: set.isDone,
  }));
}

/**
 * Cuenta cuántos ejercicios de un entreno han batido un récord (peso máximo o RM
 * estimado) frente a los entrenos anteriores del mismo cliente (D-128, D-129).
 * Usa la fórmula única de `records.ts` y `rm.ts`. Un ejercicio que se hace por
 * primera vez no cuenta como récord.
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
    const current = computeExerciseRecords(toRecordInputs(exercise.sets));
    if (current.maxWeightKg === null && current.maxRm === null) {
      continue;
    }

    const priorSets = priorWorkouts
      .flatMap((prior) => prior.exercises)
      .filter((priorEx) => priorEx.exerciseId === exercise.exerciseId && !priorEx.isSkipped)
      .flatMap((priorEx) => toRecordInputs(priorEx.sets))
      .filter((set) => set.isDone === true);
    if (priorSets.length === 0) {
      continue;
    }

    const prior = computeExerciseRecords(priorSets);
    const beatsWeight =
      current.maxWeightKg !== null && current.maxWeightKg > (prior.maxWeightKg ?? 0);
    const beatsRm = current.maxRm !== null && current.maxRm > (prior.maxRm ?? 0);
    if (beatsWeight || beatsRm) {
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
