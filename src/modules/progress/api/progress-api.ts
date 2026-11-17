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

export const bodyWeightRecordSchema = z.object({
  id: z.string(),
  measured_on: z.string(),
  weight_kg: z.number(),
});
export type BodyWeightRecord = z.infer<typeof bodyWeightRecordSchema>;

export const bodyMeasurementRecordSchema = z.object({
  id: z.string(),
  measured_on: z.string(),
  kind: z.string(),
  side: z.string().nullable(),
  value_cm: z.number(),
});
export type BodyMeasurementRecord = z.infer<typeof bodyMeasurementRecordSchema>;

export interface ClientHealthData {
  hasConsent: boolean;
  weights: BodyWeightRecord[];
  measurements: BodyMeasurementRecord[];
}

/**
 * Carga los datos de salud (peso y medidas) si existe consentimiento (D-126, D-127).
 * Si no hay consentimiento, devuelve hasConsent: false y listas vacías.
 */
export async function fetchClientHealthData(
  tenantId: string,
  clientId: string,
): Promise<ClientHealthData> {
  const consentRes = await getSupabaseClient()
    .from('health_consents')
    .select('granted_at, withdrawn_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', clientId)
    .is('withdrawn_at', null)
    .maybeSingle();

  if (consentRes.error !== null) {
    throw new Error(`Could not load health consent: ${consentRes.error.code}`);
  }

  const hasConsent = Boolean(
    consentRes.data !== null && consentRes.data.granted_at && consentRes.data.withdrawn_at === null,
  );

  if (!hasConsent) {
    return { hasConsent: false, weights: [], measurements: [] };
  }

  const [weightsRes, measurementsRes] = await Promise.all([
    getSupabaseClient()
      .from('body_weights')
      .select('id, measured_on, weight_kg')
      .eq('tenant_id', tenantId)
      .eq('user_id', clientId)
      .order('measured_on', { ascending: true }),
    getSupabaseClient()
      .from('body_measurements')
      .select('id, measured_on, kind, side, value_cm')
      .eq('tenant_id', tenantId)
      .eq('user_id', clientId)
      .order('measured_on', { ascending: true }),
  ]);

  if (weightsRes.error !== null) {
    throw new Error(`Could not load body weights: ${weightsRes.error.code}`);
  }
  if (measurementsRes.error !== null) {
    throw new Error(`Could not load body measurements: ${measurementsRes.error.code}`);
  }

  return {
    hasConsent: true,
    weights: z.array(bodyWeightRecordSchema).parse(weightsRes.data),
    measurements: z.array(bodyMeasurementRecordSchema).parse(measurementsRes.data),
  };
}
