import type { JsonValue } from './active-workout';
import type { WorkoutSetRecord } from './workout-types';

/** 7 días en milisegundos (D-124). */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface ClientWorkoutExercise {
  id: string;
  position: number;
  exercise_id: string;
  replaces_exercise_id: string | null;
  superset_group: number | null;
  prescribed_sets: unknown;
  prescribed_rest_seconds: number | null;
  coach_note: string | null;
  day_note: string | null;
  is_skipped: boolean;
  changed_at: string;
  workout_sets: WorkoutSetRecord[];
}

export interface ClientWorkoutRecord {
  id: string;
  tenant_id: string;
  client_id: string;
  program_id: string | null;
  block_id: string | null;
  program_day_id: string | null;
  day_number: number;
  performed_on: string;
  started_at: string;
  closed_at: string | null;
  edited_at: string | null;
  close_reason: string | null;
  last_changed_at: string;
  note: string | null;
  programs?: { id: string; name: string } | null;
  program_days?: { id: string; name: string | null } | null;
  workout_exercises: ClientWorkoutExercise[];
}

/**
 * Determina si un entreno se puede corregir (D-116, D-124):
 * - Solo en la app del móvil (`isMobile === true`).
 * - Solo entrenos cerrados (`closed_at !== null`).
 * - Solo durante 7 días desde su cierre.
 */
export function canCorrectWorkout(
  workout: { closed_at: string | null },
  isMobile: boolean,
  nowMs: number = Date.now(),
): boolean {
  if (!isMobile) {
    return false;
  }
  if (workout.closed_at === null) {
    return false;
  }
  const closedTime = new Date(workout.closed_at).getTime();
  if (isNaN(closedTime)) {
    return false;
  }
  const diff = nowMs - closedTime;
  return diff >= 0 && diff <= SEVEN_DAYS_MS;
}

/**
 * Determina si el entreno pertenece a una rutina anterior del cliente.
 */
export function isPreviousRoutine(
  workoutProgramId: string | null,
  currentProgramId: string | null,
): boolean {
  if (workoutProgramId === null || currentProgramId === null) {
    return false;
  }
  return workoutProgramId !== currentProgramId;
}

/**
 * Prepara el payload para la función RPC `sync_workout` con los cambios de la corrección.
 */
export function buildCorrectionSyncPayload(
  workout: ClientWorkoutRecord,
  deviceId: string | null = null,
  now: string = new Date().toISOString(),
): { [key: string]: JsonValue } {
  return {
    id: workout.id,
    program_id: workout.program_id,
    block_id: workout.block_id,
    program_day_id: workout.program_day_id,
    day_number: workout.day_number,
    performed_on: workout.performed_on,
    started_at: workout.started_at,
    last_changed_at: now,
    closed_at: workout.closed_at,
    close_reason: workout.close_reason ?? 'manual',
    device_id: deviceId,
    device_since: workout.started_at,
    note: workout.note,
    exercises: workout.workout_exercises.map((exercise) => ({
      id: exercise.id,
      position: exercise.position,
      exercise_id: exercise.exercise_id,
      superset_group: exercise.superset_group,
      prescribed_sets: (exercise.prescribed_sets ?? []) as JsonValue,
      prescribed_rest_seconds: exercise.prescribed_rest_seconds,
      coach_note: exercise.coach_note,
      day_note: exercise.day_note,
      is_skipped: exercise.is_skipped,
      replaces_exercise_id: exercise.replaces_exercise_id,
      changed_at: now,
      sets: exercise.is_skipped
        ? []
        : exercise.workout_sets
            .filter((set) => set.recorded_at !== null)
            .map((set) => ({
              id: set.id,
              set_number: set.set_number,
              side: set.side,
              weight_kg: set.weight_kg,
              reps: set.reps,
              duration_seconds: set.duration_seconds,
              distance_meters: set.distance_meters,
              intensity_type: set.intensity_type,
              intensity_value: set.intensity_value,
              is_done: set.is_done,
              is_extra: set.is_extra,
              is_warmup: set.is_warmup ?? false,
              recorded_at: now,
            })),
    })),
  };
}
