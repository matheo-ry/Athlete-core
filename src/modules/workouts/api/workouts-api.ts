import { z } from 'zod';

import { getSupabaseClient } from '@/core/supabase';

import type { WorkoutActivityRecord } from '../model/workout-activity';

const workoutSetRowSchema = z.object({
  set_number: z.number(),
  weight_kg: z.number().or(z.string()).nullable(),
  reps: z.number().nullable(),
  intensity_type: z.string().nullable(),
  intensity_value: z.number().or(z.string()).nullable(),
  is_done: z.boolean(),
});

const workoutExerciseRowSchema = z.object({
  id: z.string(),
  exercise_id: z.string(),
  replaces_exercise_id: z.string().nullable(),
  day_note: z.string().nullable(),
  is_skipped: z.boolean(),
  workout_sets: z.array(workoutSetRowSchema).nullable().optional(),
});

const programDayRelationSchema = z
  .union([
    z.object({ name: z.string().nullable() }),
    z.array(z.object({ name: z.string().nullable() })),
  ])
  .nullable()
  .optional();

const programBlockRelationSchema = z
  .union([z.object({ cycle_days: z.number() }), z.array(z.object({ cycle_days: z.number() }))])
  .nullable()
  .optional();

const coachActivityRowSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  day_number: z.number(),
  performed_on: z.string(),
  closed_at: z.string().nullable(),
  program_days: programDayRelationSchema,
  program_blocks: programBlockRelationSchema,
  workout_exercises: z.array(workoutExerciseRowSchema).nullable().optional(),
});

/**
 * Entrenos cerrados de los clientes del negocio para la tarjeta de actividad del coach.
 * Devuelve del más nuevo al más viejo por fecha y hora de cierre.
 */
export async function fetchCoachActivityWorkouts(
  tenantId: string,
): Promise<WorkoutActivityRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('workouts')
    .select(
      `
      id,
      client_id,
      day_number,
      performed_on,
      closed_at,
      program_days ( name ),
      program_blocks ( cycle_days ),
      workout_exercises (
        id,
        exercise_id,
        replaces_exercise_id,
        day_note,
        is_skipped,
        workout_sets (
          set_number,
          weight_kg,
          reps,
          intensity_type,
          intensity_value,
          is_done
        )
      )
    `,
    )
    .eq('tenant_id', tenantId)
    .not('closed_at', 'is', null)
    .order('performed_on', { ascending: false })
    .order('closed_at', { ascending: false });

  if (error !== null) {
    throw new Error(`Could not load coach activity workouts: ${error.code}`);
  }

  const rows = z.array(coachActivityRowSchema).parse(data ?? []);

  return rows.map((row) => {
    const rawDay = Array.isArray(row.program_days) ? row.program_days[0] : row.program_days;
    const rawBlock = Array.isArray(row.program_blocks) ? row.program_blocks[0] : row.program_blocks;
    const dayName = rawDay?.name ?? null;
    const cycleDays = rawBlock?.cycle_days ?? 7;

    const exercises = (row.workout_exercises ?? []).map((ex) => ({
      id: ex.id,
      exerciseId: ex.exercise_id,
      replacesExerciseId: ex.replaces_exercise_id,
      dayNote: ex.day_note,
      isSkipped: ex.is_skipped,
      sets: (ex.workout_sets ?? []).map((s) => ({
        setNumber: s.set_number,
        weightKg: s.weight_kg !== null ? Number(s.weight_kg) : null,
        reps: s.reps,
        intensityType: s.intensity_type,
        intensityValue: s.intensity_value !== null ? Number(s.intensity_value) : null,
        isDone: s.is_done,
      })),
    }));

    return {
      id: row.id,
      clientId: row.client_id,
      performedOn: row.performed_on,
      dayNumber: row.day_number,
      dayName: dayName || (cycleDays === 7 ? null : `Día ${row.day_number}`),
      exercises,
    };
  });
}
