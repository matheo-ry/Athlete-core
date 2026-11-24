import { calculateEstimatedRm } from './rm';
import type { RmCalculationInput } from './rm';

/**
 * Récords de un ejercicio (D-129):
 * - Peso máximo levantado (en kg).
 * - RM estimado más alto (en kg).
 */
export interface ExerciseRecords {
  maxWeightKg: number | null;
  maxRm: number | null;
}

export interface SetWithRecordInput extends RmCalculationInput {
  isDone?: boolean | null;
  isWarmup?: boolean | null;
}

/**
 * Comprueba los récords conseguidos en una lista de series históricas de un ejercicio.
 */
export function computeExerciseRecords(sets: readonly SetWithRecordInput[]): ExerciseRecords {
  let maxWeightKg: number | null = null;
  let maxRm: number | null = null;

  for (const set of sets) {
    if (set.isDone === false || set.isWarmup === true) {
      continue;
    }

    if (set.weightKg != null && set.weightKg > 0) {
      if (maxWeightKg == null || set.weightKg > maxWeightKg) {
        maxWeightKg = set.weightKg;
      }
    }

    const rm = calculateEstimatedRm(set);
    if (rm != null) {
      if (maxRm == null || rm > maxRm) {
        maxRm = rm;
      }
    }
  }

  return { maxWeightKg, maxRm };
}

export interface SetRecordCheck {
  isMaxWeightRecord: boolean;
  isMaxRmRecord: boolean;
  isRecord: boolean;
  newRm: number | null;
}

/**
 * Comprueba si una serie nueva bate los récords previos de un ejercicio (D-129, criterio 3).
 */
export function checkSetRecord(
  set: SetWithRecordInput,
  previousRecords: ExerciseRecords,
): SetRecordCheck {
  if (set.isDone === false || set.isWarmup === true) {
    return {
      isMaxWeightRecord: false,
      isMaxRmRecord: false,
      isRecord: false,
      newRm: null,
    };
  }

  const isMaxWeightRecord =
    set.weightKg != null &&
    set.weightKg > 0 &&
    (previousRecords.maxWeightKg == null || set.weightKg > previousRecords.maxWeightKg);

  const newRm = calculateEstimatedRm(set);
  const isMaxRmRecord =
    newRm != null && (previousRecords.maxRm == null || newRm > previousRecords.maxRm);

  return {
    isMaxWeightRecord,
    isMaxRmRecord,
    isRecord: isMaxWeightRecord || isMaxRmRecord,
    newRm,
  };
}

export interface WorkoutExerciseSets {
  exerciseId: string;
  sets: readonly SetWithRecordInput[];
}

export interface WorkoutRecordsResult {
  recordsCount: number;
  exercisesWithRecords: string[];
}

/**
 * Detecta cuántos récords se batieron en un entreno comparado con el historial previo
 * (para el resumen del entreno PR 3.6 y la actividad del coach PR 3.14).
 */
export function detectWorkoutRecords(
  workoutExercises: readonly WorkoutExerciseSets[],
  previousHistoryByExercise: ReadonlyMap<string, readonly SetWithRecordInput[]>,
): WorkoutRecordsResult {
  let recordsCount = 0;
  const exercisesWithRecords: string[] = [];

  for (const wex of workoutExercises) {
    const prevSets = previousHistoryByExercise.get(wex.exerciseId) ?? [];
    let runningRecords = computeExerciseRecords(prevSets);
    let exerciseBrokeRecord = false;

    for (const set of wex.sets) {
      const check = checkSetRecord(set, runningRecords);
      if (check.isRecord) {
        recordsCount += 1;
        exerciseBrokeRecord = true;
        // Si bate récord, actualiza los running records para series posteriores del mismo entreno
        if (check.isMaxWeightRecord && set.weightKg != null) {
          runningRecords = { ...runningRecords, maxWeightKg: set.weightKg };
        }
        if (check.isMaxRmRecord && check.newRm != null) {
          runningRecords = { ...runningRecords, maxRm: check.newRm };
        }
      }
    }

    if (exerciseBrokeRecord) {
      exercisesWithRecords.push(wex.exerciseId);
    }
  }

  return { recordsCount, exercisesWithRecords };
}
