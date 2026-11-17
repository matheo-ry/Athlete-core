import { getSupabaseClient } from '@/core/supabase';
import { z } from 'zod';

import { rawWorkoutSchema } from '../model/exercise-history';
import type { RawWorkout } from '../model/exercise-history';

const WORKOUT_COLUMNS =
  'id, performed_on, started_at, closed_at, day_number, program_id, ' +
  'programs(id, name), ' +
  'workout_exercises(' +
  'id, exercise_id, replaces_exercise_id, day_note, is_skipped, position, ' +
  'workout_sets(id, set_number, side, weight_kg, reps, duration_seconds, distance_meters, intensity_type, intensity_value, is_done, recorded_at)' +
  ')';

/**
 * Carga todos los entrenos de un cliente en el negocio activo (D-129).
 * El RLS garantiza que el coach solo lee sus clientes y el cliente solo lo suyo.
 */
export async function fetchClientWorkouts(
  tenantId: string,
  clientId: string,
): Promise<RawWorkout[]> {
  const { data, error } = await getSupabaseClient()
    .from('workouts')
    .select(WORKOUT_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .order('performed_on', { ascending: true })
    .order('started_at', { ascending: true });

  if (error !== null) {
    throw new Error(`Could not load client workouts: ${error.code}`);
  }

  return z.array(rawWorkoutSchema).parse(data);
}

/**
 * Obtiene el ID de la rutina vigente del cliente (si tiene alguna activa).
 */
export async function fetchCurrentClientProgramId(
  tenantId: string,
  clientId: string,
): Promise<string | null> {
  const { data, error } = await getSupabaseClient()
    .from('programs')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .is('archived_at', null)
    .is('ended_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error !== null) {
    throw new Error(`Could not load current program: ${error.code}`);
  }

  return data?.id ?? null;
}
