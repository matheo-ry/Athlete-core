import { z } from 'zod';

import { getSupabaseClient } from '@/core/supabase';

import type { ClientWorkoutRecord } from '../model/workout-correction';

const clientWorkoutSetSchema = z.object({
  id: z.string(),
  workout_exercise_id: z.string(),
  set_number: z.number().int(),
  side: z.enum(['right', 'left', 'none']),
  weight_kg: z
    .number()
    .or(z.string())
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  reps: z.number().int().nullable(),
  duration_seconds: z.number().int().nullable(),
  distance_meters: z.number().int().nullable(),
  intensity_type: z.string().nullable(),
  intensity_value: z
    .number()
    .or(z.string())
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  is_done: z.boolean(),
  is_extra: z.boolean(),
  recorded_at: z.string(),
});

const clientWorkoutExerciseSchema = z.object({
  id: z.string(),
  workout_id: z.string(),
  position: z.number().int(),
  exercise_id: z.string(),
  replaces_exercise_id: z.string().nullable(),
  superset_group: z.number().int().nullable(),
  prescribed_sets: z.unknown(),
  prescribed_rest_seconds: z.number().int().nullable(),
  coach_note: z.string().nullable(),
  day_note: z.string().nullable(),
  is_skipped: z.boolean(),
  changed_at: z.string(),
  workout_sets: z.array(clientWorkoutSetSchema).default([]),
});

const programRelationSchema = z
  .union([
    z.object({ id: z.string(), name: z.string() }),
    z.array(z.object({ id: z.string(), name: z.string() })),
  ])
  .nullable()
  .optional();

const programDayRelationSchema = z
  .union([
    z.object({ id: z.string(), name: z.string().nullable() }),
    z.array(z.object({ id: z.string(), name: z.string().nullable() })),
  ])
  .nullable()
  .optional();

const clientWorkoutRowSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  client_id: z.string(),
  program_id: z.string().nullable(),
  block_id: z.string().nullable(),
  program_day_id: z.string().nullable(),
  day_number: z.number().int(),
  performed_on: z.string(),
  started_at: z.string(),
  closed_at: z.string().nullable(),
  edited_at: z.string().nullable(),
  close_reason: z.string().nullable(),
  last_changed_at: z.string(),
  note: z.string().nullable().default(null),
  programs: programRelationSchema,
  program_days: programDayRelationSchema,
  workout_exercises: z.array(clientWorkoutExerciseSchema).default([]),
});

/**
 * Carga los entrenos del cliente (ordenados del más nuevo al más viejo).
 */
export async function fetchClientHistoryWorkouts(
  tenantId: string,
  clientId: string,
): Promise<ClientWorkoutRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('workouts')
    .select(
      `
      id, tenant_id, client_id, program_id, block_id, program_day_id, day_number,
      performed_on, started_at, closed_at, edited_at, close_reason, last_changed_at, note,
      programs ( id, name ),
      program_days ( id, name ),
      workout_exercises (
        id, workout_id, position, exercise_id, replaces_exercise_id, superset_group,
        prescribed_sets, prescribed_rest_seconds, coach_note, day_note, is_skipped, changed_at,
        workout_sets (
          id, workout_exercise_id, set_number, side, weight_kg, reps, duration_seconds,
          distance_meters, intensity_type, intensity_value, is_done, is_extra, recorded_at
        )
      )
    `,
    )
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId)
    .not('closed_at', 'is', null)
    .order('performed_on', { ascending: false })
    .order('started_at', { ascending: false });

  if (error !== null) {
    throw new Error(`Could not load client workouts: ${error.code}`);
  }

  const rows = z.array(clientWorkoutRowSchema).parse(data ?? []);

  return rows.map((row) => {
    const rawProgram = Array.isArray(row.programs)
      ? (row.programs[0] ?? null)
      : (row.programs ?? null);
    const rawDay = Array.isArray(row.program_days)
      ? (row.program_days[0] ?? null)
      : (row.program_days ?? null);

    const exercises = [...row.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((we) => ({
        ...we,
        workout_sets: [...we.workout_sets].sort((a, b) => {
          if (a.set_number !== b.set_number) return a.set_number - b.set_number;
          return a.side.localeCompare(b.side);
        }),
      }));

    return {
      ...row,
      programs: rawProgram,
      program_days: rawDay,
      workout_exercises: exercises,
    };
  });
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
