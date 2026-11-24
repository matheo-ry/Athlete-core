import type { ActiveWorkout } from './active-workout';
import { previousSet } from './active-workout';
import type { OfflineSnapshot } from './offline-snapshot';
import { previousFor } from './offline-snapshot';

export interface SetPerformance {
  weightKg: number | null;
  reps: number | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  isDone?: boolean | null;
}

/**
 * Comprueba si una serie realizada mejora a la misma serie de la vez anterior (D-130):
 * - Más peso con al menos 1 repetición.
 * - Mismo peso con más repeticiones.
 * - Más tiempo o más distancia si el ejercicio se mide por tiempo o distancia.
 */
export function isMiniAchievement(
  current: SetPerformance,
  previous: SetPerformance | null,
): boolean {
  if (previous === null) {
    return false;
  }
  if (current.isDone === false) {
    return false;
  }

  // Medición por tiempo
  if (current.durationSeconds != null || previous.durationSeconds != null) {
    const currSec = current.durationSeconds ?? 0;
    const prevSec = previous.durationSeconds ?? 0;
    return currSec > prevSec && prevSec > 0;
  }

  // Medición por distancia
  if (current.distanceMeters != null || previous.distanceMeters != null) {
    const currDist = current.distanceMeters ?? 0;
    const prevDist = previous.distanceMeters ?? 0;
    return currDist > prevDist && prevDist > 0;
  }

  // Medición por peso y repeticiones
  const currW = current.weightKg ?? 0;
  const prevW = previous.weightKg ?? 0;
  const currR = current.reps ?? 0;
  const prevR = previous.reps ?? 0;

  if (currR <= 0) {
    return false;
  }

  // Más peso
  if (currW > prevW) {
    return true;
  }

  // Mismo peso y más repeticiones
  if (currW === prevW && currR > prevR) {
    return true;
  }

  return false;
}

/**
 * Cuenta cuántos minilogros se han obtenido en un entreno comparando con el snapshot offline.
 */
export function countWorkoutMiniAchievements(
  workout: ActiveWorkout,
  snapshot: OfflineSnapshot | null,
): number {
  if (snapshot === null) {
    return 0;
  }
  let count = 0;
  for (const exercise of workout.exercises) {
    if (exercise.isSkipped) {
      continue;
    }
    const previous = previousFor(snapshot, exercise.exerciseId, workout.dayNumber);
    for (const set of exercise.sets) {
      if (!set.isDone) {
        continue;
      }
      const before = previousSet(previous, set.setNumber, set.side);
      if (before !== null && isMiniAchievement(set, before)) {
        count++;
      }
    }
  }
  return count;
}
