import { z } from 'zod';

import { getSupabaseClient } from '@/core/supabase';

import {
  bodyMeasurementSchema,
  bodyWeightSchema,
  missedDaySchema,
  workoutRecordSchema,
} from '../model/workout-types';
import type {
  BodyMeasurementRecord,
  BodyWeightRecord,
  ClientExerciseSetupRecord,
  MissedDayRecord,
  WorkoutRecord,
} from '../model/workout-types';

export interface ClientHealthData {
  hasConsent: boolean;
  weights: BodyWeightRecord[];
  measurements: BodyMeasurementRecord[];
}

export interface ProgramDayInfo {
  id: string;
  name: string | null;
  day_number: number;
}

/** Entrenos del cliente para el coach. */
export async function fetchClientWorkouts(
  tenantId: string,
  clientId: string,
): Promise<WorkoutRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('workouts')
    .select(
      `
      id, tenant_id, client_id, program_id, block_id, program_day_id, day_number,
      performed_on, started_at, closed_at, edited_at, close_reason, last_changed_at, note,
      workout_exercises (
        id, workout_id, position, exercise_id, replaces_exercise_id, superset_group,
        prescribed_sets, prescribed_rest_seconds, coach_note, day_note, is_skipped, changed_at,
        workout_sets (
          id, workout_exercise_id, set_number, side, weight_kg, reps, duration_seconds,
          distance_meters, intensity_type, intensity_value, is_done, is_extra, is_warmup, recorded_at
        )
      )
    `,
    )
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .order('performed_on', { ascending: false });

  if (error !== null) {
    throw new Error(`Could not load client workouts: ${error.code}`);
  }

  // Ordenar los ejercicios por su posición y las series por set_number
  return z
    .array(workoutRecordSchema)
    .parse(data)
    .map((workout) => ({
      ...workout,
      workout_exercises: [...(workout.workout_exercises ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((we) => ({
          ...we,
          workout_sets: [...(we.workout_sets ?? [])].sort((a, b) => {
            if (a.set_number !== b.set_number) return a.set_number - b.set_number;
            return a.side.localeCompare(b.side);
          }),
        })),
    }));
}

/** Días faltados por el cliente en sus rutinas. */
export async function fetchClientMissedDays(
  tenantId: string,
  clientId: string,
): Promise<MissedDayRecord[]> {
  const clientPrograms = await getSupabaseClient()
    .from('programs')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId);

  if (clientPrograms.error !== null) {
    throw new Error(`Could not load client programs: ${clientPrograms.error.code}`);
  }
  if (clientPrograms.data.length === 0) {
    return [];
  }

  const programIds = clientPrograms.data.map((p) => p.id);

  const { data, error } = await getSupabaseClient()
    .from('program_missed_days')
    .select('id, tenant_id, program_id, block_id, program_day_id, day_number, missed_on')
    .eq('tenant_id', tenantId)
    .in('program_id', programIds)
    .order('missed_on', { ascending: false });

  if (error !== null) {
    throw new Error(`Could not load missed days: ${error.code}`);
  }

  return z.array(missedDaySchema).parse(data);
}

/**
 * Datos de salud del cliente si dio el consentimiento (D-126, D-127).
 * Mirar aquí el consentimiento es solo para saber qué pantalla enseñar: la
 * protección real son las políticas de body_weights y body_measurements
 * (migración 20261117110000_health_data.sql), que sin consentimiento no dejan
 * al coach leer nada.
 */
export async function fetchClientHealthData(
  tenantId: string,
  clientId: string,
): Promise<ClientHealthData> {
  const consentRes = await getSupabaseClient()
    .from('health_consents')
    .select('id, user_id, granted_at, withdrawn_at, text_version')
    .eq('tenant_id', tenantId)
    .eq('user_id', clientId)
    .is('withdrawn_at', null)
    .maybeSingle();

  // Un fallo no puede leerse como "sin consentimiento": se propaga y la pestaña muestra el error.
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
      .order('measured_on', { ascending: false }),
    getSupabaseClient()
      .from('body_measurements')
      .select('id, measured_on, kind, side, value_cm')
      .eq('tenant_id', tenantId)
      .eq('user_id', clientId)
      .order('measured_on', { ascending: false }),
  ]);

  if (weightsRes.error !== null) {
    throw new Error(`Could not load body weights: ${weightsRes.error.code}`);
  }
  if (measurementsRes.error !== null) {
    throw new Error(`Could not load body measurements: ${measurementsRes.error.code}`);
  }

  return {
    hasConsent: true,
    weights: z.array(bodyWeightSchema).parse(weightsRes.data),
    measurements: z.array(bodyMeasurementSchema).parse(measurementsRes.data),
  };
}

/** Set-ups del cliente para cada ejercicio (D-122). */
export async function fetchClientSetups(
  tenantId: string,
  clientId: string,
): Promise<ClientExerciseSetupRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('client_exercise_setups')
    .select('exercise_id, setup')
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId);

  if (error !== null) {
    throw new Error(`Could not load exercise setups: ${error.code}`);
  }

  return data ?? [];
}

/** Nombres de los días de las rutinas del tenant. */
export async function fetchProgramDays(tenantId: string): Promise<ProgramDayInfo[]> {
  const { data, error } = await getSupabaseClient()
    .from('program_days')
    .select('id, name, day_number')
    .eq('tenant_id', tenantId);

  if (error !== null) {
    throw new Error(`Could not load program days: ${error.code}`);
  }

  return data;
}
