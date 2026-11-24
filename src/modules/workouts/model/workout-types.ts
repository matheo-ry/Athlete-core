import { z } from 'zod';

export const workoutSetSchema = z.object({
  id: z.string().uuid(),
  workout_exercise_id: z.string().uuid(),
  set_number: z.number().int().min(1),
  side: z.enum(['right', 'left', 'none']),
  weight_kg: z.number().nullable(),
  reps: z.number().int().nullable(),
  duration_seconds: z.number().int().nullable(),
  distance_meters: z.number().int().nullable(),
  intensity_type: z.string().nullable(),
  intensity_value: z.number().nullable(),
  is_warmup: z.boolean().optional(),
  is_done: z.boolean(),
  is_extra: z.boolean(),
  recorded_at: z.string(),
});

export type WorkoutSetRecord = z.infer<typeof workoutSetSchema>;

/** Filtra las series efectivas (excluye las de calentamiento, D-ideas-2). */
export function effectiveWorkoutSets<T extends { is_warmup?: boolean }>(sets: readonly T[]): T[] {
  return sets.filter((set) => !set.is_warmup);
}

/** Filtra las series de calentamiento ordenadas por número de serie (D-ideas-2). */
export function warmupWorkoutSets<T extends { is_warmup?: boolean; set_number: number }>(
  sets: readonly T[],
): T[] {
  return sets.filter((set) => Boolean(set.is_warmup)).sort((a, b) => a.set_number - b.set_number);
}

export const workoutExerciseSchema = z.object({
  id: z.string().uuid(),
  workout_id: z.string().uuid(),
  position: z.number().int().min(1),
  exercise_id: z.string().uuid(),
  replaces_exercise_id: z.string().uuid().nullable(),
  superset_group: z.number().int().nullable(),
  prescribed_sets: z.unknown(),
  prescribed_rest_seconds: z.number().int().nullable(),
  coach_note: z.string().nullable(),
  day_note: z.string().nullable(),
  is_skipped: z.boolean(),
  changed_at: z.string(),
  workout_sets: z.array(workoutSetSchema).default([]),
});

export type WorkoutExerciseRecord = z.infer<typeof workoutExerciseSchema>;

export const workoutRecordSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  client_id: z.string().uuid(),
  program_id: z.string().uuid().nullable(),
  block_id: z.string().uuid().nullable(),
  program_day_id: z.string().uuid().nullable(),
  day_number: z.number().int(),
  performed_on: z.string(),
  started_at: z.string(),
  closed_at: z.string().nullable(),
  edited_at: z.string().nullable(),
  close_reason: z.string().nullable(),
  last_changed_at: z.string(),
  note: z.string().nullable().default(null),
  workout_exercises: z.array(workoutExerciseSchema).default([]),
});

export type WorkoutRecord = z.infer<typeof workoutRecordSchema>;

export const missedDaySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  program_id: z.string().uuid(),
  block_id: z.string().uuid().nullable(),
  program_day_id: z.string().uuid().nullable(),
  day_number: z.number().int(),
  missed_on: z.string(),
});

export type MissedDayRecord = z.infer<typeof missedDaySchema>;

export const healthConsentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  granted_at: z.string(),
  withdrawn_at: z.string().nullable(),
  text_version: z.string(),
});

export type HealthConsentRecord = z.infer<typeof healthConsentSchema>;

export const bodyWeightSchema = z.object({
  id: z.string().uuid(),
  measured_on: z.string(),
  weight_kg: z.number(),
});

export type BodyWeightRecord = z.infer<typeof bodyWeightSchema>;

export const bodyMeasurementSchema = z.object({
  id: z.string().uuid(),
  measured_on: z.string(),
  kind: z.string(),
  side: z.string().nullable(),
  value_cm: z.number(),
});

export type BodyMeasurementRecord = z.infer<typeof bodyMeasurementSchema>;

export const clientExerciseSetupSchema = z.object({
  exercise_id: z.string().uuid(),
  setup: z.string(),
});

export type ClientExerciseSetupRecord = z.infer<typeof clientExerciseSetupSchema>;

export type ComparisonArrow = 'up' | 'down' | 'same' | null;

export type HistoryItem =
  | {
      type: 'workout';
      id: string;
      date: string;
      dayNumber: number;
      programDayId: string | null;
      workout: WorkoutRecord;
    }
  | {
      type: 'missed_day';
      id: string;
      date: string;
      dayNumber: number;
      programDayId: string | null;
      missedDay: MissedDayRecord;
    };
