import { logger } from '@/core/lib';
import { getSupabaseClient } from '@/core/supabase';

import { parseClientPrograms } from '../model/assignments';
import type { ClientProgram, MissedDayRule, ProgramMode } from '../model/assignments';

// Las rutinas de los clientes: leerlas y asignarlas (PR 2.13, PR 3.12). Se escriben
// con las funciones de la base de datos (D-105, D-125), como el resto de rutinas.

const BLOCKS = 'program_blocks!program_blocks_tenant_id_program_id_fkey';
const RULES = 'program_missed_day_rules!program_missed_day_rules_tenant_id_program_id_fkey';
const MISSED_DAYS = 'program_missed_days!program_missed_days_tenant_id_program_id_fkey';
const WORKOUTS = 'workouts!workouts_tenant_id_program_id_fkey';

const PROGRAM_SELECT = `
  id,
  name,
  client_id,
  starts_on,
  start_block_id,
  mode,
  ${BLOCKS}(id, position, cycle_days, laps),
  ${RULES}(rule, starts_on),
  ${MISSED_DAYS}(id, block_id, program_day_id, day_number, missed_on),
  ${WORKOUTS}(id, program_day_id, day_number, performed_on, closed_at)
`;

/** Las rutinas abiertas de los clientes del negocio: vigentes y próximas. */
export async function fetchClientPrograms(tenantId: string): Promise<ClientProgram[]> {
  const { data, error } = await getSupabaseClient()
    .from('programs')
    .select(PROGRAM_SELECT)
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
    .select(`${PROGRAM_SELECT}, ended_at`)
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

export type SetMissedDayRuleResult =
  | { status: 'done' }
  | {
      status:
        | 'program_already_ended'
        | 'invalid_mode'
        | 'invalid_rule'
        | 'invalid_today'
        | 'not_allowed'
        | 'error';
    };

/** El coach cambia la regla del día saltado para la rutina de un cliente (D-125, D-139). */
export async function setMissedDayRule(
  tenantId: string,
  programId: string,
  rule: MissedDayRule,
  today: string,
): Promise<SetMissedDayRuleResult> {
  const { error } = await getSupabaseClient().rpc('set_missed_day_rule', {
    p_tenant: tenantId,
    p_program: programId,
    p_rule: rule,
    p_today: today,
  });
  if (error === null) {
    return { status: 'done' };
  }
  const known = [
    'program_already_ended',
    'invalid_mode',
    'invalid_rule',
    'invalid_today',
    'not_allowed',
  ] as const;
  const match = known.find((m) => error.message === m);
  if (match !== undefined) {
    return { status: match };
  }
  logger.error('Could not set missed day rule', { code: error.code, rule: error.message });
  return { status: 'error' };
}

export type RecordMissedDaysResult =
  | { status: 'done' }
  | {
      status:
        | 'not_allowed'
        | 'program_not_found'
        | 'invalid_mode'
        | 'invalid_days'
        | 'invalid_date'
        | 'invalid_reference'
        | 'error';
    };

/** La app del cliente apunta los días de entreno faltados desde la última vez (D-125, D-139). */
export async function recordMissedDays(
  tenantId: string,
  programId: string,
  days: Array<{ program_day_id: string; missed_on: string }>,
  today: string,
): Promise<RecordMissedDaysResult> {
  const { error } = await getSupabaseClient().rpc('record_missed_days', {
    p_tenant: tenantId,
    p_program: programId,
    p_days: days,
    p_today: today,
  });
  if (error === null) {
    return { status: 'done' };
  }
  const known = [
    'not_allowed',
    'program_not_found',
    'invalid_mode',
    'invalid_days',
    'invalid_date',
    'invalid_reference',
  ] as const;
  const match = known.find((m) => error.message === m);
  if (match !== undefined) {
    return { status: match };
  }
  logger.error('Could not record missed days', { code: error.code, rule: error.message });
  return { status: 'error' };
}
