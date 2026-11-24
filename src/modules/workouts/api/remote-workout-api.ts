import { z } from 'zod';

import { getSupabaseClient } from '@/core/supabase';

import type { RemoteWorkout } from '../model/workout-handover';

// Los entrenos abiertos del cliente en la nube, para saber si están en otro
// móvil y poder seguirlos aquí (D-124, D-152). Solo se leen (D-138).

const EXERCISES = 'workout_exercises!workout_exercises_tenant_id_workout_id_fkey';
const SETS = 'workout_sets!workout_sets_tenant_id_workout_id_workout_exercise_id_fkey';
/** Solo debería haber uno (D-119); sin conexión pueden juntarse alguno más (D-138). */
const LIMIT = 5;

const setSchema = z.object({
  id: z.string(),
  set_number: z.number().int().min(1).max(10),
  side: z.enum(['none', 'right', 'left']),
  weight_kg: z.number().nullable(),
  reps: z.number().int().nullable(),
  duration_seconds: z.number().int().nullable(),
  distance_meters: z.number().int().nullable(),
  intensity_type: z.enum(['rir', 'rpe', 'failure']).nullable(),
  intensity_value: z.number().nullable(),
  is_extra: z.boolean(),
  is_done: z.boolean(),
  recorded_at: z.string(),
});

const exerciseSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1),
  exercise_id: z.string(),
  program_day_exercise_id: z.string().nullable(),
  superset_group: z.number().int().nullable(),
  prescribed_sets: z.array(z.json()),
  prescribed_rest_seconds: z.number().int().nullable(),
  coach_note: z.string().nullable(),
  day_note: z.string().nullable().default(null),
  is_skipped: z.boolean(),
  replaces_exercise_id: z.string().nullable(),
  changed_at: z.string(),
  workout_sets: z.array(setSchema),
});

const workoutSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  program_id: z.string().nullable(),
  block_id: z.string().nullable(),
  program_day_id: z.string().nullable(),
  day_number: z.number().int().min(1),
  started_at: z.string(),
  last_changed_at: z.string(),
  open_device_id: z.string().nullable(),
  device_since: z.string().nullable(),
  workout_exercises: z.array(exerciseSchema),
});

function toRemote(row: z.infer<typeof workoutSchema>): RemoteWorkout {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    programId: row.program_id,
    blockId: row.block_id,
    programDayId: row.program_day_id,
    dayNumber: row.day_number,
    startedAt: row.started_at,
    lastChangedAt: row.last_changed_at,
    openDeviceId: row.open_device_id,
    deviceSince: row.device_since,
    exercises: row.workout_exercises.map((exercise) => ({
      id: exercise.id,
      position: exercise.position,
      exerciseId: exercise.exercise_id,
      programDayExerciseId: exercise.program_day_exercise_id,
      supersetGroup: exercise.superset_group,
      restSeconds: exercise.prescribed_rest_seconds,
      coachNote: exercise.coach_note,
      dayNote: exercise.day_note,
      prescribedSets: exercise.prescribed_sets,
      isSkipped: exercise.is_skipped,
      replacesExerciseId: exercise.replaces_exercise_id,
      changedAt: exercise.changed_at,
      sets: exercise.workout_sets.map((set) => ({
        id: set.id,
        setNumber: set.set_number,
        side: set.side,
        weightKg: set.weight_kg,
        reps: set.reps,
        durationSeconds: set.duration_seconds,
        distanceMeters: set.distance_meters,
        intensityType: set.intensity_type,
        intensityValue: set.intensity_value,
        isDone: set.is_done,
        isExtra: set.is_extra,
        recordedAt: set.recorded_at,
      })),
    })),
  };
}

export async function fetchOpenWorkouts(
  tenantId: string,
  clientId: string,
): Promise<RemoteWorkout[]> {
  const { data, error } = await getSupabaseClient()
    .from('workouts')
    .select(
      `id, tenant_id, program_id, block_id, program_day_id, day_number, started_at, last_changed_at, open_device_id, device_since, ${EXERCISES}(id, position, exercise_id, program_day_exercise_id, superset_group, prescribed_sets, prescribed_rest_seconds, coach_note, is_skipped, replaces_exercise_id, changed_at, ${SETS}(id, set_number, side, weight_kg, reps, duration_seconds, distance_meters, intensity_type, intensity_value, is_extra, is_done, recorded_at))`,
    )
    .eq('tenant_id', tenantId)
    // Quien es coach y cliente a la vez lee más entrenos que los suyos.
    .eq('client_id', clientId)
    .is('closed_at', null)
    .order('last_changed_at', { ascending: false })
    .limit(LIMIT);
  if (error !== null) {
    throw new Error(`Could not load open workouts: ${error.code}`);
  }
  return z.array(workoutSchema).parse(data).map(toRemote);
}

/** Si ese entreno sigue abierto en la nube: `false` si se cerró o se descartó. */
export async function isWorkoutOpen(tenantId: string, workoutId: string): Promise<boolean> {
  const { data, error } = await getSupabaseClient()
    .from('workouts')
    .select('closed_at')
    .eq('tenant_id', tenantId)
    .eq('id', workoutId)
    .maybeSingle();
  if (error !== null) {
    throw new Error(`Could not check the workout: ${error.code}`);
  }
  return data !== null && data.closed_at === null;
}
