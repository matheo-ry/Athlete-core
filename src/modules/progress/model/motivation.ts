import type { IconName } from '@/core/ui';
import { checkSetRecord, computeExerciseRecords, isMiniAchievement } from '@/modules/workouts';

import type { RawWorkout } from './exercise-history';

export interface LevelConfig {
  level: number;
  key: string;
  minWorkouts: number;
}

export const LEVELS: readonly LevelConfig[] = [
  { level: 1, key: 'novice', minWorkouts: 0 },
  { level: 2, key: 'consistent', minWorkouts: 5 },
  { level: 3, key: 'committed', minWorkouts: 10 },
  { level: 4, key: 'disciplined', minWorkouts: 25 },
  { level: 5, key: 'strong', minWorkouts: 50 },
  { level: 6, key: 'unstoppable', minWorkouts: 100 },
  { level: 7, key: 'legend', minWorkouts: 200 },
] as const;

export interface LevelInfo {
  level: number;
  key: string;
  minWorkouts: number;
  nextLevelWorkouts: number | null;
  progress: number;
  totalWorkouts: number;
}

export interface WeekDayStatus {
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  date: string; // YYYY-MM-DD
  dayKey: string; // 'mon', 'tue', etc.
  isDone: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeekTracker {
  days: WeekDayStatus[];
  completedDays: number;
  targetDays: number;
  isComplete: boolean;
}

export interface AchievementConfig {
  id: string;
  icon: IconName;
  target: number;
}

export const ACHIEVEMENTS_CONFIG: readonly AchievementConfig[] = [
  { id: 'first_workout', icon: 'dumbbell', target: 1 },
  { id: 'first_full_week', icon: 'calendar', target: 1 },
  { id: 'workouts_10', icon: 'flame', target: 10 },
  { id: 'workouts_25', icon: 'flame', target: 25 },
  { id: 'workouts_50', icon: 'flame', target: 50 },
  { id: 'workouts_100', icon: 'flame', target: 100 },
  { id: 'workouts_200', icon: 'trophy', target: 200 },
  { id: 'first_record', icon: 'zap', target: 1 },
  { id: 'records_10', icon: 'zap', target: 10 },
  { id: 'records_50', icon: 'zap', target: 50 },
  { id: 'streak_4_weeks', icon: 'award', target: 4 },
  { id: 'streak_12_weeks', icon: 'award', target: 12 },
  { id: 'streak_26_weeks', icon: 'award', target: 26 },
  { id: 'first_minilogro', icon: 'sparkles', target: 1 },
  { id: 'minilogros_100', icon: 'sparkles', target: 100 },
  { id: 'first_body_weight', icon: 'scale', target: 1 },
  { id: 'workout_over_60_min', icon: 'timer', target: 1 },
  { id: 'perfect_month', icon: 'trophy', target: 1 },
] as const;

export interface AchievementItem {
  id: string;
  icon: IconName;
  target: number;
  current: number;
  isUnlocked: boolean;
}

export interface MotivationState {
  totalWorkouts: number;
  recordsCount: number;
  minilogrosCount: number;
  currentStreak: number;
  maxStreak: number;
  completedWeeksCount: number;
  weekTracker: WeekTracker;
  level: LevelInfo;
  achievements: AchievementItem[];
}

export interface MotivationInput {
  rawWorkouts: readonly RawWorkout[];
  bodyWeightsCount?: number;
  now?: string; // YYYY-MM-DD or ISO string
  targetDaysPerWeek?: number;
  hasMissedDaysInMonth?: boolean;
}

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** Devuelve la fecha del lunes (YYYY-MM-DD) de la semana ISO a la que pertenece la fecha dada. */
export function getMondayOfIsoWeek(dateStr: string): string {
  const parts = dateStr.slice(0, 10).split('-');
  const year = Number(parts[0] ?? '2026');
  const month = Number(parts[1] ?? '1');
  const day = Number(parts[2] ?? '1');
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

/** Añade o resta un número de días a una fecha YYYY-MM-DD en UTC. */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const parts = dateStr.slice(0, 10).split('-');
  const year = Number(parts[0] ?? '2026');
  const month = Number(parts[1] ?? '1');
  const day = Number(parts[2] ?? '1');
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Calcula el nivel (1 al 7) y el progreso según los entrenos completados. */
export function calculateLevel(totalWorkouts: number): LevelInfo {
  let currentLevel: LevelConfig = LEVELS[0] ?? { level: 1, key: 'novice', minWorkouts: 0 };
  let nextLevel: LevelConfig | null = LEVELS[1] ?? null;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const lvl = LEVELS[i];
    if (lvl && totalWorkouts >= lvl.minWorkouts) {
      currentLevel = lvl;
      nextLevel = (i + 1 < LEVELS.length ? LEVELS[i + 1] : null) ?? null;
      break;
    }
  }

  const nextMin = nextLevel ? nextLevel.minWorkouts : null;
  const progress =
    nextMin === null
      ? 1
      : Math.min(
          1,
          Math.max(
            0,
            (totalWorkouts - currentLevel.minWorkouts) / (nextMin - currentLevel.minWorkouts),
          ),
        );

  return {
    level: currentLevel.level,
    key: currentLevel.key,
    minWorkouts: currentLevel.minWorkouts,
    nextLevelWorkouts: nextMin,
    progress,
    totalWorkouts,
  };
}

/** Comprueba si un entreno cuenta como completado. */
function isWorkoutDone(w: RawWorkout): boolean {
  if (w.closed_at !== null) return true;
  return w.workout_exercises.some((e) => !e.is_skipped && e.workout_sets.some((s) => s.is_done));
}

/**
 * Calcula la racha semanal (semanas completas seguidas) y el estado de la semana actual.
 */
export function calculateStreakAndTracker(
  workouts: readonly RawWorkout[],
  targetDaysPerWeek = 4,
  nowStr = new Date().toISOString().slice(0, 10),
): {
  currentStreak: number;
  maxStreak: number;
  completedWeeksCount: number;
  weekTracker: WeekTracker;
} {
  const today = nowStr.slice(0, 10);
  const currentMonday = getMondayOfIsoWeek(today);

  // Agrupar fechas únicas de entreno por lunes de semana
  const workoutsByMonday = new Map<string, Set<string>>();
  for (const w of workouts) {
    if (!isWorkoutDone(w)) continue;
    const date = w.performed_on.slice(0, 10);
    const monday = getMondayOfIsoWeek(date);
    let set = workoutsByMonday.get(monday);
    if (!set) {
      set = new Set<string>();
      workoutsByMonday.set(monday, set);
    }
    set.add(date);
  }

  // Tracker de la semana actual (lunes a domingo)
  const currentWeekDoneDates = workoutsByMonday.get(currentMonday) ?? new Set<string>();
  const trackerDays: WeekDayStatus[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = addDaysToDateStr(currentMonday, i);
    trackerDays.push({
      dayIndex: i,
      date: dayDate,
      dayKey: WEEK_DAY_KEYS[i] ?? 'mon',
      isDone: currentWeekDoneDates.has(dayDate),
      isToday: dayDate === today,
      isFuture: dayDate > today,
    });
  }

  const currentWeekCompletedDays = currentWeekDoneDates.size;
  const currentWeekIsComplete = currentWeekCompletedDays >= targetDaysPerWeek;

  const weekTracker: WeekTracker = {
    days: trackerDays,
    completedDays: currentWeekCompletedDays,
    targetDays: targetDaysPerWeek,
    isComplete: currentWeekIsComplete,
  };

  // Semanas completadas en total
  let completedWeeksCount = 0;
  for (const dates of workoutsByMonday.values()) {
    if (dates.size >= targetDaysPerWeek) {
      completedWeeksCount++;
    }
  }

  // Racha actual:
  // Si la semana actual está completa: 1 + semanas anteriores consecutivas completas.
  // Si está en curso y la anterior estuvo completa: no rompe la racha (D-130).
  let currentStreak = 0;
  if (currentWeekIsComplete) {
    currentStreak = 1;
    let prevMonday = addDaysToDateStr(currentMonday, -7);
    while ((workoutsByMonday.get(prevMonday)?.size ?? 0) >= targetDaysPerWeek) {
      currentStreak++;
      prevMonday = addDaysToDateStr(prevMonday, -7);
    }
  } else {
    // Semana en curso: comprobar si la semana anterior estuvo completa
    let prevMonday = addDaysToDateStr(currentMonday, -7);
    while ((workoutsByMonday.get(prevMonday)?.size ?? 0) >= targetDaysPerWeek) {
      currentStreak++;
      prevMonday = addDaysToDateStr(prevMonday, -7);
    }
  }

  // Racha máxima histórica (maxStreak)
  let maxStreak = currentStreak;
  // Recorrer todas las semanas ordenadas cronológicamente
  const allMondays = Array.from(workoutsByMonday.keys()).sort();
  const firstMonday = allMondays[0];
  if (firstMonday !== undefined) {
    let rolling = 0;
    let iterMonday: string = firstMonday;
    while (iterMonday <= currentMonday) {
      const isComplete = (workoutsByMonday.get(iterMonday)?.size ?? 0) >= targetDaysPerWeek;
      if (isComplete) {
        rolling++;
        if (rolling > maxStreak) {
          maxStreak = rolling;
        }
      } else if (iterMonday !== currentMonday) {
        rolling = 0;
      }
      iterMonday = addDaysToDateStr(iterMonday, 7);
    }
  }

  return {
    currentStreak,
    maxStreak,
    completedWeeksCount,
    weekTracker,
  };
}

/**
 * Cuenta los récords y minilogros en base al historial de entrenos.
 */
export function calculateRecordsAndMinilogros(workouts: readonly RawWorkout[]): {
  recordsCount: number;
  minilogrosCount: number;
  hasWorkoutOver60Min: boolean;
} {
  let recordsCount = 0;
  let minilogrosCount = 0;
  let hasWorkoutOver60Min = false;

  // Ordenar entrenos de más antiguo a más nuevo
  const sortedWorkouts = [...workouts].filter(isWorkoutDone).sort((a, b) => {
    const cmp = a.performed_on.localeCompare(b.performed_on);
    return cmp !== 0 ? cmp : a.started_at.localeCompare(b.started_at);
  });

  // Para récords: por cada ejercicio, historial de series pasadas
  const exerciseHistorySets = new Map<
    string,
    { weightKg: number | null; reps: number | null; isDone?: boolean | null }[]
  >();

  // Para minilogros: por cada ejercicio y day_number, última serie realizada por setNumber y side
  const previousExerciseSets = new Map<
    string,
    Map<
      string,
      {
        weightKg: number | null;
        reps: number | null;
        durationSeconds?: number | null;
        distanceMeters?: number | null;
      }
    >
  >();

  for (const w of sortedWorkouts) {
    // Duración de entreno > 60 minutos
    if (w.started_at && w.closed_at) {
      const durationMs = new Date(w.closed_at).getTime() - new Date(w.started_at).getTime();
      if (durationMs >= 60 * 60 * 1000) {
        hasWorkoutOver60Min = true;
      }
    }

    for (const wex of w.workout_exercises) {
      if (wex.is_skipped) continue;
      const exId = wex.exercise_id;

      let history = exerciseHistorySets.get(exId);
      if (!history) {
        history = [];
        exerciseHistorySets.set(exId, history);
      }

      const exerciseKey = `${exId}_${String(w.day_number)}`;
      let prevSetsMap = previousExerciseSets.get(exerciseKey);
      if (!prevSetsMap) {
        prevSetsMap = new Map();
        previousExerciseSets.set(exerciseKey, prevSetsMap);
      }

      for (const set of wex.workout_sets) {
        if (!set.is_done) continue;

        // Comprobación de récord personal
        const currentRecords = computeExerciseRecords(history);
        const check = checkSetRecord(
          { weightKg: set.weight_kg, reps: set.reps, isDone: true },
          currentRecords,
        );
        if (check.isRecord) {
          recordsCount++;
        }
        history.push({ weightKg: set.weight_kg, reps: set.reps, isDone: true });

        // Comprobación de minilogro contra la serie anterior equivalente
        const setKey = `${String(set.set_number)}_${set.side}`;
        const prevSet = prevSetsMap.get(setKey);
        if (prevSet) {
          if (
            isMiniAchievement(
              {
                weightKg: set.weight_kg,
                reps: set.reps,
                durationSeconds: set.duration_seconds,
                distanceMeters: set.distance_meters,
                isDone: true,
              },
              prevSet,
            )
          ) {
            minilogrosCount++;
          }
        }

        // Actualizar la serie anterior para la próxima sesión
        prevSetsMap.set(setKey, {
          weightKg: set.weight_kg,
          reps: set.reps,
          durationSeconds: set.duration_seconds,
          distanceMeters: set.distance_meters,
        });
      }
    }
  }

  return { recordsCount, minilogrosCount, hasWorkoutOver60Min };
}

/**
 * Evalúa los 18 logros del sistema según los datos agregados.
 */
export function evaluateAchievements(stats: {
  totalWorkouts: number;
  completedWeeksCount: number;
  recordsCount: number;
  minilogrosCount: number;
  maxStreak: number;
  bodyWeightsCount: number;
  hasWorkoutOver60Min: boolean;
  perfectMonth: boolean;
}): AchievementItem[] {
  return ACHIEVEMENTS_CONFIG.map((cfg) => {
    let current = 0;
    let isUnlocked = false;

    switch (cfg.id) {
      case 'first_workout':
        current = Math.min(stats.totalWorkouts, 1);
        isUnlocked = stats.totalWorkouts >= 1;
        break;
      case 'first_full_week':
        current = Math.min(stats.completedWeeksCount, 1);
        isUnlocked = stats.completedWeeksCount >= 1;
        break;
      case 'workouts_10':
        current = Math.min(stats.totalWorkouts, 10);
        isUnlocked = stats.totalWorkouts >= 10;
        break;
      case 'workouts_25':
        current = Math.min(stats.totalWorkouts, 25);
        isUnlocked = stats.totalWorkouts >= 25;
        break;
      case 'workouts_50':
        current = Math.min(stats.totalWorkouts, 50);
        isUnlocked = stats.totalWorkouts >= 50;
        break;
      case 'workouts_100':
        current = Math.min(stats.totalWorkouts, 100);
        isUnlocked = stats.totalWorkouts >= 100;
        break;
      case 'workouts_200':
        current = Math.min(stats.totalWorkouts, 200);
        isUnlocked = stats.totalWorkouts >= 200;
        break;
      case 'first_record':
        current = Math.min(stats.recordsCount, 1);
        isUnlocked = stats.recordsCount >= 1;
        break;
      case 'records_10':
        current = Math.min(stats.recordsCount, 10);
        isUnlocked = stats.recordsCount >= 10;
        break;
      case 'records_50':
        current = Math.min(stats.recordsCount, 50);
        isUnlocked = stats.recordsCount >= 50;
        break;
      case 'streak_4_weeks':
        current = Math.min(stats.maxStreak, 4);
        isUnlocked = stats.maxStreak >= 4;
        break;
      case 'streak_12_weeks':
        current = Math.min(stats.maxStreak, 12);
        isUnlocked = stats.maxStreak >= 12;
        break;
      case 'streak_26_weeks':
        current = Math.min(stats.maxStreak, 26);
        isUnlocked = stats.maxStreak >= 26;
        break;
      case 'first_minilogro':
        current = Math.min(stats.minilogrosCount, 1);
        isUnlocked = stats.minilogrosCount >= 1;
        break;
      case 'minilogros_100':
        current = Math.min(stats.minilogrosCount, 100);
        isUnlocked = stats.minilogrosCount >= 100;
        break;
      case 'first_body_weight':
        current = Math.min(stats.bodyWeightsCount, 1);
        isUnlocked = stats.bodyWeightsCount >= 1;
        break;
      case 'workout_over_60_min':
        current = stats.hasWorkoutOver60Min ? 1 : 0;
        isUnlocked = stats.hasWorkoutOver60Min;
        break;
      case 'perfect_month':
        current = stats.perfectMonth ? 1 : 0;
        isUnlocked = stats.perfectMonth;
        break;
    }

    return {
      id: cfg.id,
      icon: cfg.icon,
      target: cfg.target,
      current,
      isUnlocked,
    };
  });
}

/**
 * Función principal pura que calcula todo el estado de motivación del cliente.
 */
export function calculateMotivation(input: MotivationInput): MotivationState {
  const completedWorkouts = input.rawWorkouts.filter(isWorkoutDone);
  const totalWorkouts = completedWorkouts.length;
  const targetDays = input.targetDaysPerWeek ?? 4;
  const nowStr = input.now ?? new Date().toISOString();

  const { currentStreak, maxStreak, completedWeeksCount, weekTracker } = calculateStreakAndTracker(
    completedWorkouts,
    targetDays,
    nowStr,
  );

  const { recordsCount, minilogrosCount, hasWorkoutOver60Min } =
    calculateRecordsAndMinilogros(completedWorkouts);

  const bodyWeightsCount = input.bodyWeightsCount ?? 0;
  const perfectMonth = maxStreak >= 4 && !(input.hasMissedDaysInMonth ?? false);

  const level = calculateLevel(totalWorkouts);

  const achievements = evaluateAchievements({
    totalWorkouts,
    completedWeeksCount,
    recordsCount,
    minilogrosCount,
    maxStreak,
    bodyWeightsCount,
    hasWorkoutOver60Min,
    perfectMonth,
  });

  return {
    totalWorkouts,
    recordsCount,
    minilogrosCount,
    currentStreak,
    maxStreak,
    completedWeeksCount,
    weekTracker,
    level,
    achievements,
  };
}
