import { getSupabaseClient } from '@/core/supabase';

import { parseExercises } from '../model/exercise-schema';
import type { Exercise } from '../model/exercise-schema';

// Único archivo del módulo que habla con la base de datos. El RLS solo deja
// ver los ejercicios de los negocios donde el usuario es owner o staff; el
// filtro por negocio elige el espacio activo entre ellos.
const COLUMNS =
  'id, name, library_key, muscle_group, equipment, measurement, is_unilateral, archived_at, ' +
  'exercise_library(name_en, name_es)';

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
