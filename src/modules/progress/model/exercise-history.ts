import { z } from 'zod';

import type { Language } from '@/core/i18n';
import type { WeightUnit } from '@/core/lib';
import { fromKg } from '@/core/lib';
import { computeExerciseRecords } from '@/modules/workouts';
import type { ExerciseRecords } from '@/modules/workouts';

// Esquemas de lo que llega de Supabase: se valida en la frontera (AGENTS §4).
export const rawWorkoutSetSchema = z.object({
  id: z.string(),
  set_number: z.number().int(),
  side: z.string(),
  weight_kg: z.number().nullable(),
  reps: z.number().int().nullable(),
  duration_seconds: z.number().int().nullable(),
  distance_meters: z.number().nullable(),
  intensity_type: z.string().nullable(),
  intensity_value: z.number().nullable(),
  is_warmup: z.boolean().optional(),
  is_done: z.boolean(),
  recorded_at: z.string(),
});
export type RawWorkoutSet = z.infer<typeof rawWorkoutSetSchema>;

export const rawWorkoutExerciseSchema = z.object({
  id: z.string(),
  exercise_id: z.string(),
  replaces_exercise_id: z.string().nullable(),
  day_note: z.string().nullable(),
  is_skipped: z.boolean(),
  position: z.number().int(),
  workout_sets: z.array(rawWorkoutSetSchema),
});
export type RawWorkoutExercise = z.infer<typeof rawWorkoutExerciseSchema>;

export const rawWorkoutSchema = z.object({
  id: z.string(),
  performed_on: z.string(),
  started_at: z.string(),
  closed_at: z.string().nullable(),
  day_number: z.number().int(),
  program_id: z.string().nullable(),
  programs: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  workout_exercises: z.array(rawWorkoutExerciseSchema),
});
export type RawWorkout = z.infer<typeof rawWorkoutSchema>;

export interface ExerciseInfo {
  id: string;
  name: string;
  measurement: string;
  isUnilateral: boolean;
}

/** Formatea una sola serie en texto, ej. "45×8(1)", "D: 30×9(1)", "40s" */
export function formatSetText(
  set: RawWorkoutSet,
  measurement: string,
  isUnilateral: boolean,
  language: Language,
  unit: WeightUnit = 'kg',
): string {
  // Prefijo de lado en unilaterales
  let sidePrefix = '';
  if (isUnilateral) {
    if (set.side === 'right') {
      sidePrefix = language === 'en' ? 'R: ' : 'D: ';
    } else if (set.side === 'left') {
      sidePrefix = language === 'en' ? 'L: ' : 'I: ';
    }
  }

  // Intensidad en paréntesis: (1), (F), etc.
  let intensityText = '';
  if (set.intensity_type === 'failure') {
    intensityText = '(F)';
  } else if (set.intensity_type === 'rir' && set.intensity_value != null) {
    intensityText = `(${set.intensity_value})`;
  } else if (set.intensity_type === 'rpe' && set.intensity_value != null) {
    const rir = Math.max(0, 10 - set.intensity_value);
    intensityText = `(${rir})`;
  } else if (set.intensity_value != null) {
    intensityText = `(${set.intensity_value})`;
  }

  if (measurement === 'time') {
    const dur = set.duration_seconds ?? 0;
    return `${sidePrefix}${dur}s${intensityText}`;
  }

  if (measurement === 'distance') {
    const dist = set.distance_meters ?? 0;
    return `${sidePrefix}${dist}m${intensityText}`;
  }

  // weight_reps o bodyweight_reps
  const rawWeight = set.weight_kg ?? 0;
  const convertedWeight = fromKg(rawWeight, unit);
  // Redondeo a 1 decimal si tiene decimales, o entero
  const formattedWeight =
    Math.round(convertedWeight * 10) / 10 === Math.round(convertedWeight)
      ? Math.round(convertedWeight).toString()
      : (Math.round(convertedWeight * 10) / 10).toString();

  const reps = set.reps ?? 0;
  return `${sidePrefix}${formattedWeight}×${reps}${intensityText}`;
}

export interface ExerciseSessionHistory {
  workoutId: string;
  sessionNumber: number;
  label: string; // "DIA 1"
  performedOn: string; // "2026-10-06"
  setsText: string; // "45×8(1) / 45×7(1)"
  fullText: string; // "DIA 1: 45×8(1) / 45×7(1)"
  dayNote: string | null;
  hasNote: boolean;
  maxWeightKg: number | null;
  maxRm: number | null;
  volumeKg: number;
  totalReps: number;
}

export interface ExerciseProgressItem {
  exerciseId: string;
  displayName: string;
  measurement: string;
  isUnilateral: boolean;
  records: ExerciseRecords;
  lastSession: ExerciseSessionHistory | null;
  history: ExerciseSessionHistory[];
}

export interface ProgramProgressGroup {
  programId: string;
  programName: string;
  isCurrent: boolean;
  lastPerformedOn: string | null;
  exercises: ExerciseProgressItem[];
}

/**
 * Agrupa los entrenos de un cliente por rutina (D-129), y para cada ejercicio
 * calcula su historial en texto ("DIA 1: 45×8(1) / 45×7(1)"), su último y sus récords.
 */
export function groupWorkoutsByProgram(
  workouts: readonly RawWorkout[],
  exerciseInfoMap: ReadonlyMap<string, ExerciseInfo>,
  currentProgramId: string | null,
  language: Language,
  unit: WeightUnit,
  // El texto "DIA n" llega traducido de fuera: el modelo no escribe textos visibles.
  dayLabel: (sessionNumber: number) => string,
): ProgramProgressGroup[] {
  // 1. Filtrar entrenos ordenados cronológicamente (más antiguo a más nuevo para numerar DIA 1, DIA 2...)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    const cmp = a.performed_on.localeCompare(b.performed_on);
    return cmp !== 0 ? cmp : a.started_at.localeCompare(b.started_at);
  });

  // Mapa de programId -> mapa de exerciseId -> array de sesiones
  interface TempSessionData {
    workoutId: string;
    performedOn: string;
    wex: RawWorkoutExercise;
  }
  const programMap = new Map<
    string,
    {
      name: string;
      exerciseSessions: Map<string, TempSessionData[]>;
      lastDate: string;
    }
  >();

  for (const w of sortedWorkouts) {
    const progId = w.program_id ?? 'unknown';
    const progName = w.programs?.name ?? 'Sin rutina';

    let progEntry = programMap.get(progId);
    if (!progEntry) {
      progEntry = {
        name: progName,
        exerciseSessions: new Map(),
        lastDate: w.performed_on,
      };
      programMap.set(progId, progEntry);
    }
    if (w.performed_on > progEntry.lastDate) {
      progEntry.lastDate = w.performed_on;
    }

    for (const wex of w.workout_exercises) {
      if (wex.is_skipped) {
        continue;
      }
      // D-129: "Los ejercicios cambiados cuentan para el ejercicio que se hizo."
      const exId = wex.exercise_id;
      let sessions = progEntry.exerciseSessions.get(exId);
      if (!sessions) {
        sessions = [];
        progEntry.exerciseSessions.set(exId, sessions);
      }
      sessions.push({
        workoutId: w.id,
        performedOn: w.performed_on,
        wex,
      });
    }
  }

  // 2. Construir la estructura final para cada programa y cada ejercicio
  const result: ProgramProgressGroup[] = [];

  for (const [progId, progData] of programMap.entries()) {
    const exercises: ExerciseProgressItem[] = [];

    for (const [exId, sessions] of progData.exerciseSessions.entries()) {
      const exInfo = exerciseInfoMap.get(exId);
      const displayName = exInfo?.name ?? 'Ejercicio';
      const measurement = exInfo?.measurement ?? 'weight_reps';
      const isUnilateral = exInfo?.isUnilateral ?? false;

      const history: ExerciseSessionHistory[] = [];
      const allSetsForRecord: {
        weightKg: number | null;
        reps: number | null;
        intensityType?: string | null;
        intensityValue?: number | null;
        isDone: boolean;
      }[] = [];

      sessions.forEach((sess, idx) => {
        const sessionNumber = idx + 1;
        const label = dayLabel(sessionNumber);

        // Ordenar series efectivas de la sesión (las de calentamiento no cuentan, D-ideas-2)
        const doneSets = (sess.wex.workout_sets ?? [])
          .filter((s) => s.is_done !== false && !s.is_warmup)
          .sort((a, b) => {
            if (a.set_number !== b.set_number) {
              return a.set_number - b.set_number;
            }
            if (a.side === 'right' && b.side === 'left') return -1;
            if (a.side === 'left' && b.side === 'right') return 1;
            return 0;
          });

        const setsText = doneSets
          .map((s) => formatSetText(s, measurement, isUnilateral, language, unit))
          .join(' / ');

        const sessionSetsForRecord = doneSets.map((s) => ({
          weightKg: s.weight_kg,
          reps: s.reps,
          intensityType: s.intensity_type,
          intensityValue: s.intensity_value,
          isDone: s.is_done,
        }));
        allSetsForRecord.push(...sessionSetsForRecord);

        const sessionRecords = computeExerciseRecords(sessionSetsForRecord);

        let volumeKg = 0;
        let totalReps = 0;
        for (const s of doneSets) {
          volumeKg += (s.weight_kg ?? 0) * (s.reps ?? 0);
          totalReps += s.reps ?? 0;
        }

        const dayNote = sess.wex.day_note?.trim() || null;
        history.push({
          workoutId: sess.workoutId,
          sessionNumber,
          label,
          performedOn: sess.performedOn,
          setsText,
          fullText: `${label}: ${setsText}`,
          dayNote,
          hasNote: dayNote !== null,
          maxWeightKg: sessionRecords.maxWeightKg,
          maxRm: sessionRecords.maxRm,
          volumeKg,
          totalReps,
        });
      });

      const records = computeExerciseRecords(allSetsForRecord);
      const lastSession = history.length > 0 ? (history[history.length - 1] ?? null) : null;

      exercises.push({
        exerciseId: exId,
        displayName,
        measurement,
        isUnilateral,
        records,
        lastSession,
        history,
      });
    }

    // Orden alfabético de ejercicios en el programa
    const collator = new Intl.Collator(language, { sensitivity: 'base' });
    exercises.sort((a, b) => collator.compare(a.displayName, b.displayName));

    const isCurrent = progId === currentProgramId;
    result.push({
      programId: progId,
      programName: progData.name,
      isCurrent,
      lastPerformedOn: progData.lastDate,
      exercises,
    });
  }

  // Ordenar programas: la vigente primero, luego las anteriores por fecha de entreno desc
  result.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return (b.lastPerformedOn ?? '').localeCompare(a.lastPerformedOn ?? '');
  });

  return result;
}
