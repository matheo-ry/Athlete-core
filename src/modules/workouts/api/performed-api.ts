import { z } from 'zod';

import { getSupabaseClient } from '@/core/supabase';

import type { PerformedExercise } from '../model/offline-snapshot';

// Lo que hizo el cliente en sus entrenos, para la vez anterior de cada
// ejercicio (D-120). Las tablas solo se leen (D-138).

const WORKOUT = 'workout:workouts!workout_exercises_tenant_id_workout_id_fkey!inner';
const SETS = 'workout_sets!workout_sets_tenant_id_workout_id_workout_exercise_id_fkey';
/** Bastan para encontrar la última vez de cada ejercicio en cada día de una rutina. */
const LIMIT = 300;

const rowSchema = z.object({
  exercise_id: z.string(),
  changed_at: z.string(),
  workout: z.object({
    program_id: z.string().nullable(),
    day_number: z.number().int(),
    performed_on: z.string(),
  }),
  workout_sets: z.array(
    z.object({
      set_number: z.number().int(),
      side: z.enum(['none', 'right', 'left']),
      weight_kg: z.number().nullable(),
      reps: z.number().int().nullable(),
      duration_seconds: z.number().int().nullable(),
      distance_meters: z.number().int().nullable(),
      intensity_type: z.enum(['rir', 'rpe', 'failure']).nullable(),
      intensity_value: z.number().nullable(),
    }),
  ),
});

/** Lo último que hizo el cliente de estos ejercicios, con solo las series hechas. */
export async function fetchPerformedExercises(
  tenantId: string,
  clientId: string,
  exerciseIds: readonly string[],
): Promise<PerformedExercise[]> {
  const { data, error } = await getSupabaseClient()
    .from('workout_exercises')
    .select(
      `exercise_id, changed_at, ${WORKOUT}(program_id, day_number, performed_on), ${SETS}(set_number, side, weight_kg, reps, duration_seconds, distance_meters, intensity_type, intensity_value)`,
    )
    .eq('tenant_id', tenantId)
    // Quien es coach y cliente a la vez lee más entrenos que los suyos.
    .eq('workout.client_id', clientId)
    .eq('is_skipped', false)
    .in('exercise_id', exerciseIds)
    .eq('workout_sets.is_done', true)
    .order('changed_at', { ascending: false })
    .limit(LIMIT);
  if (error !== null) {
    throw new Error(`Could not load previous workouts: ${error.code}`);
  }
  return z
    .array(rowSchema)
    .parse(data)
    .map((row) => ({
      exerciseId: row.exercise_id,
      programId: row.workout.program_id,
      dayNumber: row.workout.day_number,
      performedOn: row.workout.performed_on,
      changedAt: row.changed_at,
      sets: [...row.workout_sets]
        .sort((a, b) => a.set_number - b.set_number || a.side.localeCompare(b.side))
        .map((set) => ({
          setNumber: set.set_number,
          side: set.side,
          weightKg: set.weight_kg,
          reps: set.reps,
          durationSeconds: set.duration_seconds,
          distanceMeters: set.distance_meters,
          intensityType: set.intensity_type,
          intensityValue: set.intensity_value,
        })),
    }));
}
