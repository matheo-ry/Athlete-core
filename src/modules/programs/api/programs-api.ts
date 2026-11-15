import { logger } from '@/core/lib';
import { getSupabaseClient } from '@/core/supabase';

import { parseProgramDocument, toSavePayload } from '../model/program-document';
import type { ProgramDocument } from '../model/program-document';
import { parseTemplates } from '../model/template-list';
import type { TemplateSummary } from '../model/template-list';

// Único archivo del módulo que habla con la base de datos. Las tablas de
// rutinas solo se leen; se escriben con las funciones save_program y
// set_program_archived (D-094 y D-096).

// Entre programs y program_blocks hay dos relaciones (los bloques de la
// rutina y el bloque de inicio, D-083): hay que decir cuál se usa.
const BLOCKS = 'program_blocks!program_blocks_tenant_id_program_id_fkey';

const TEMPLATE_COLUMNS = `id, name, updated_at, archived_at, ${BLOCKS}(position, cycle_days, program_days(kind))`;

const DOCUMENT_COLUMNS =
  `id, name, client_id, updated_at, ${BLOCKS}(id, position, name, cycle_days, laps, ` +
  'program_days(id, day_number, kind, name, subtitle, place, ' +
  'program_day_exercises(id, position, exercise_id, superset_group, rest_seconds, note, ' +
  'program_sets(id, position, reps_min, reps_max, duration_seconds, distance_meters, ' +
  'intensity_type, intensity_value, target_load_kg))))';

/** Las plantillas del negocio, activas y archivadas (la búsqueda va en la app). */
export async function fetchTemplates(tenantId: string): Promise<TemplateSummary[]> {
  const { data, error } = await getSupabaseClient()
    .from('programs')
    .select(TEMPLATE_COLUMNS)
    .eq('tenant_id', tenantId)
    .is('client_id', null);
  if (error !== null) {
    // El registro lo hace la caché de TanStack Query (app/query-client.ts).
    throw new Error(`Could not load templates: ${error.code}`);
  }
  return parseTemplates(data);
}

/** Una rutina entera, para el editor (D-079). */
export async function fetchProgram(tenantId: string, programId: string): Promise<ProgramDocument> {
  const { data, error } = await getSupabaseClient()
    .from('programs')
    .select(DOCUMENT_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('id', programId)
    .single();
  if (error !== null) {
    throw new Error(`Could not load program: ${error.code}`);
  }
  return parseProgramDocument(data);
}

export type SaveProgramResult =
  | { status: 'saved'; id: string; updatedAt: string }
  | { status: 'conflict' | 'limit_reached' | 'error' };

/** Lo que dice la base de datos de lo guardado (D-096). */
function parseSaved(data: unknown): { id: string; updatedAt: string } | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const { id, updated_at: updatedAt } = data as Record<string, unknown>;
  return typeof id === 'string' && typeof updatedAt === 'string' ? { id, updatedAt } : null;
}

/**
 * Guarda la rutina entera, o nada (D-079 y D-096). Los errores de la base de
 * datos son nombres de regla, sin datos personales: se pueden registrar.
 */
export async function saveProgram(
  tenantId: string,
  document: ProgramDocument,
): Promise<SaveProgramResult> {
  const { data, error } = await getSupabaseClient().rpc('save_program', {
    p_tenant: tenantId,
    p_program: toSavePayload(document),
  });
  if (error === null) {
    const saved = parseSaved(data);
    if (saved !== null) {
      return { status: 'saved', ...saved };
    }
    logger.error('Unexpected save_program result');
    return { status: 'error' };
  }
  if (error.message === 'program_conflict') {
    return { status: 'conflict' };
  }
  if (error.message === 'template_limit_reached') {
    return { status: 'limit_reached' };
  }
  logger.error('Could not save program', { code: error.code, rule: error.message });
  return { status: 'error' };
}

export type ArchiveTemplateResult = { status: 'saved' | 'limit_reached' | 'error' };

/** Archivar o recuperar una plantilla. Recuperar pasa por el tope de 300 (D-086). */
export async function setTemplateArchived(
  tenantId: string,
  programId: string,
  archived: boolean,
): Promise<ArchiveTemplateResult> {
  const { error } = await getSupabaseClient().rpc('set_program_archived', {
    p_tenant: tenantId,
    p_program: programId,
    p_archived: archived,
  });
  if (error === null) {
    return { status: 'saved' };
  }
  if (error.message === 'template_limit_reached') {
    return { status: 'limit_reached' };
  }
  logger.error('Could not archive template', { code: error.code, rule: error.message });
  return { status: 'error' };
}
