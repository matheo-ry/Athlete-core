import type { ComparisonArrow, WorkoutSetRecord } from './workout-types';

/**
 * Formatea una serie individual al estilo Excel / app de notas:
 * Ej: "45×8(1)", "45s", "400m", "(F)".
 */
export function formatSetExcel(set: WorkoutSetRecord): string {
  let main: string;
  if (set.duration_seconds !== null && set.duration_seconds > 0) {
    main = `${set.duration_seconds}s`;
  } else if (set.distance_meters !== null && set.distance_meters > 0) {
    main = `${set.distance_meters}m`;
  } else {
    const weightStr =
      set.weight_kg !== null && set.weight_kg > 0
        ? Number.isInteger(set.weight_kg)
          ? String(set.weight_kg)
          : String(Number(set.weight_kg.toFixed(1)))
        : null;

    const repsStr = set.reps !== null ? String(set.reps) : '';

    if (weightStr !== null && repsStr !== '') {
      main = `${weightStr}×${repsStr}`;
    } else if (weightStr !== null) {
      main = `${weightStr} kg`;
    } else {
      main = repsStr;
    }
  }

  let intensityStr = '';
  if (set.intensity_type === 'failure' || set.intensity_value === -1) {
    intensityStr = '(F)';
  } else if (set.intensity_type === 'rir' && set.intensity_value !== null) {
    intensityStr = `(${set.intensity_value})`;
  } else if (set.intensity_type === 'rpe' && set.intensity_value !== null) {
    intensityStr = `(@${set.intensity_value})`;
  }

  const sidePrefix = set.side === 'right' ? 'D: ' : set.side === 'left' ? 'I: ' : '';

  return `${sidePrefix}${main}${intensityStr}`.trim();
}

/**
 * Une las series hechas de un ejercicio con " / ".
 * Ej: "45×8(1) / 45×7(1)" o para unilaterales "D: 30×9(1) / I: 30×8(1)".
 */
export function formatExerciseSetsExcel(sets: readonly WorkoutSetRecord[]): string {
  const doneSets = sets.filter((s) => s.is_done);
  if (doneSets.length === 0) {
    return '—';
  }

  return doneSets.map(formatSetExcel).join(' / ');
}

/**
 * Formato de duración en horas y minutos.
 * Ej: "45 min" o "1 h 12 min".
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours} h ${remaining} min` : `${hours} h`;
}

/**
 * Calcula la duración a partir de started_at y closed_at.
 */
export function formatDurationBetween(startedAt: string, closedAt: string | null): string | null {
  if (closedAt === null) {
    return null;
  }
  const start = new Date(startedAt).getTime();
  const end = new Date(closedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) {
    return null;
  }
  const minutes = Math.round((end - start) / 60000);
  return formatDuration(minutes);
}

/**
 * Compara el rendimiento de las series hechas de un ejercicio frente a la vez anterior.
 * Devuelve 'up' (↑), 'down' (↓), 'same' (→), o null si es la primera vez o no hay datos.
 */
export function compareExercisePerformance(
  currentSets: readonly WorkoutSetRecord[],
  previousSets: readonly WorkoutSetRecord[] | null,
): ComparisonArrow {
  if (previousSets === null) {
    return null;
  }

  const currentDone = currentSets.filter((s) => s.is_done);
  const previousDone = previousSets.filter((s) => s.is_done);

  if (currentDone.length === 0 || previousDone.length === 0) {
    return null;
  }

  const score = (sets: readonly WorkoutSetRecord[]) => {
    let maxWeight = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let totalSeconds = 0;

    for (const s of sets) {
      const w = s.weight_kg ?? 0;
      const r = s.reps ?? 0;
      const sec = s.duration_seconds ?? 0;

      if (w > maxWeight) maxWeight = w;
      totalVolume += (w > 0 ? w : 1) * (r > 0 ? r : 1);
      totalReps += r;
      totalSeconds += sec;
    }

    return { maxWeight, totalVolume, totalReps, totalSeconds };
  };

  const curr = score(currentDone);
  const prev = score(previousDone);

  if (curr.totalSeconds > 0 || prev.totalSeconds > 0) {
    if (curr.totalSeconds > prev.totalSeconds) return 'up';
    if (curr.totalSeconds < prev.totalSeconds) return 'down';
    return 'same';
  }

  if (curr.maxWeight > prev.maxWeight) return 'up';
  if (curr.maxWeight < prev.maxWeight) return 'down';

  if (curr.totalVolume > prev.totalVolume) return 'up';
  if (curr.totalVolume < prev.totalVolume) return 'down';

  if (curr.totalReps > prev.totalReps) return 'up';
  if (curr.totalReps < prev.totalReps) return 'down';

  return 'same';
}

/**
 * Busca las series de la vez anterior en que se hizo ese ejercicio (D-120):
 * primero en el mismo día de la rutina; si no, en cualquier día.
 */
export function findPreviousExerciseSets(
  workouts: readonly {
    id: string;
    day_number: number;
    workout_exercises: readonly {
      exercise_id: string;
      is_skipped: boolean;
      workout_sets: readonly WorkoutSetRecord[];
    }[];
  }[],
  currentWorkoutId: string,
  exerciseId: string,
): readonly WorkoutSetRecord[] | null {
  const currentIndex = workouts.findIndex((w) => w.id === currentWorkoutId);
  if (currentIndex === -1) return null;

  const currentWorkout = workouts[currentIndex];
  const olderWorkouts = workouts.slice(currentIndex + 1);

  // 1. Mismo día de la rutina (D-120: lunes con lunes)
  for (const w of olderWorkouts) {
    if (currentWorkout !== undefined && w.day_number === currentWorkout.day_number) {
      const match = w.workout_exercises.find(
        (we) => we.exercise_id === exerciseId && !we.is_skipped,
      );
      if (match && match.workout_sets.some((s) => s.is_done)) {
        return match.workout_sets;
      }
    }
  }

  // 2. Cualquier día anterior
  for (const w of olderWorkouts) {
    const match = w.workout_exercises.find((we) => we.exercise_id === exerciseId && !we.is_skipped);
    if (match && match.workout_sets.some((s) => s.is_done)) {
      return match.workout_sets;
    }
  }

  return null;
}
