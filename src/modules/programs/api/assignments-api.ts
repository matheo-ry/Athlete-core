import { logger } from '@/core/lib';
import { getSupabaseClient } from '@/core/supabase';

import { parseClientPrograms } from '../model/assignments';
import type { ClientProgram, ProgramMode } from '../model/assignments';

// Las rutinas de los clientes: leerlas y asignarlas (PR 2.13). Se escriben
// con las funciones de la base de datos (D-105), como el resto de rutinas.

const BLOCKS = 'program_blocks!program_blocks_tenant_id_program_id_fkey';

/** Las rutinas abiertas de los clientes del negocio: vigentes y próximas. */
export async function fetchClientPrograms(tenantId: string): Promise<ClientProgram[]> {
  const { data, error } = await getSupabaseClient()
    .from('programs')
    .select(
      `id, name, client_id, starts_on, start_block_id, mode, ${BLOCKS}(id, position, cycle_days, laps)`,
    )
    .eq('tenant_id', tenantId)
    .not('client_id', 'is', null)
    .is('ended_at', null);
  if (error !== null) {
    // El registro lo hace la caché de TanStack Query (app/query-client.ts).
    throw new Error(`Could not load client programs: ${error.code}`);
  }
  return parseClientPrograms(data);
}

/** Todas las rutinas de un cliente, también las anteriores, para su ficha (PR 2.14). */
export async function fetchProgramsOfClient(
  tenantId: string,
  clientId: string,
): Promise<ClientProgram[]> {
  const { data, error } = await getSupabaseClient()
    .from('programs')
    .select(
      `id, name, client_id, starts_on, start_block_id, mode, ended_at, ${BLOCKS}(id, position, cycle_days, laps)`,
    )
    .eq('tenant_id', tenantId)
    .eq('client_id', clientId);
  if (error !== null) {
    throw new Error(`Could not load the client's programs: ${error.code}`);
  }
  return parseClientPrograms(data);
}

export interface AssignInput {
  templateId: string;
  clientIds: string[];
  startsOn: string;
  mode: ProgramMode;
  today: string;
}

export type AssignResult =
  | { status: 'assigned'; count: number }
  | { status: 'client_not_found' | 'template_archived' | 'error' };

const KNOWN_ERRORS = ['client_not_found', 'template_archived'] as const;

/** Asigna la plantilla a todos los clientes elegidos, o a ninguno (D-105). */
export async function assignProgram(tenantId: string, input: AssignInput): Promise<AssignResult> {
  const { data, error } = await getSupabaseClient().rpc('assign_program', {
    p_tenant: tenantId,
    p_template: input.templateId,
    p_clients: input.clientIds,
    p_starts_on: input.startsOn,
    p_mode: input.mode,
    p_today: input.today,
  });
  if (error === null) {
    return { status: 'assigned', count: Array.isArray(data) ? data.length : 0 };
  }
  const known = KNOWN_ERRORS.find((name) => error.message === name);
  if (known !== undefined) {
    return { status: known };
  }
  // El mensaje es el nombre de una regla, sin datos personales.
  logger.error('Could not assign program', { code: error.code, rule: error.message });
  return { status: 'error' };
}
