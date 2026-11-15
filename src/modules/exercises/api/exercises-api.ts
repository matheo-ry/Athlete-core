import { logger } from '@/core/lib';
import { getSupabaseClient } from '@/core/supabase';

import type { ExerciseInput } from '../model/exercise-form';
import { parseExercise, parseExercises } from '../model/exercise-schema';
import type { Exercise } from '../model/exercise-schema';

// Único archivo del módulo que habla con la base de datos. El RLS solo deja
// ver los ejercicios de los negocios donde el usuario es owner o staff; el
// filtro por negocio elige el espacio activo entre ellos.
const COLUMNS =
  'id, name, library_key, muscle_group, equipment, measurement, is_unilateral, instructions, ' +
  'video_url, archived_at, ' +
  'exercise_library(name_en, name_es, measurement, is_unilateral, muscle_group, equipment)';

/** Todos los ejercicios del negocio, activos y archivados (la búsqueda va en la app, D-073). */
export async function fetchExercises(tenantId: string): Promise<Exercise[]> {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .select(COLUMNS)
    .eq('tenant_id', tenantId)
    // Primero los activos: la API devuelve 1.000 filas como mucho y el tope de
    // activos es 1.000 (D-086), así que la pestaña "Activos" sale siempre entera.
    .order('archived_at', { ascending: false, nullsFirst: true });
  if (error !== null) {
    // El registro lo hace la caché de TanStack Query (app/query-client.ts).
    throw new Error(`Could not load exercises: ${error.code}`);
  }
  return parseExercises(data);
}

export type SaveExerciseResult =
  { status: 'saved'; exercise: Exercise } | { status: 'limit_reached' | 'error' };

function toColumns(input: ExerciseInput) {
  return {
    name: input.name,
    measurement: input.measurement,
    is_unilateral: input.isUnilateral,
    muscle_group: input.muscleGroup,
    equipment: input.equipment,
    instructions: input.instructions,
    video_url: input.videoUrl,
  };
}

function toResult(
  data: unknown,
  error: { code: string; message: string } | null,
  action: string,
): SaveExerciseResult {
  if (error === null) {
    return { status: 'saved', exercise: parseExercise(data) };
  }
  // El tope de 1.000 sin archivar (D-086) lo pone un trigger de la migración 8.
  if (error.message === 'exercise_limit_reached') {
    return { status: 'limit_reached' };
  }
  logger.error('Could not save exercise', { action, code: error.code });
  return { status: 'error' };
}

/** Un ejercicio propio nuevo. `created_by` lo exige el RLS: tiene que ser quien lo crea. */
export async function createExercise(
  tenantId: string,
  userId: string,
  input: ExerciseInput,
): Promise<SaveExerciseResult> {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .insert({ ...toColumns(input), tenant_id: tenantId, created_by: userId })
    .select(COLUMNS)
    .single();
  return toResult(data, error, 'create');
}

/** Cambiar un ejercicio del negocio, venga o no del catálogo (D-071). */
export async function updateExercise(
  id: string,
  input: ExerciseInput,
): Promise<SaveExerciseResult> {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .update(toColumns(input))
    .eq('id', id)
    .select(COLUMNS)
    .single();
  return toResult(data, error, 'update');
}

/**
 * Archivar o recuperar (D-073). Nunca se borra. Recuperar pasa por el tope de
 * 1.000 sin archivar (D-086).
 */
export async function setExerciseArchived(
  id: string,
  archived: boolean,
): Promise<SaveExerciseResult> {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select(COLUMNS)
    .single();
  return toResult(data, error, archived ? 'archive' : 'unarchive');
}
