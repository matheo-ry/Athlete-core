import { logger } from '@/core/lib';
import { getSupabaseClient } from '@/core/supabase';

import type { ProgramMode } from '../model/assignments';

// Lo que el coach hace con la rutina de un cliente desde su ficha (PR 2.14b):
// las funciones de la base de datos del PR 2.12 (D-105).

export type ClientProgramAction =
  | {
      kind: 'create';
      clientId: string;
      name: string;
      cycleDays: number;
      startsOn: string;
      mode: ProgramMode;
    }
  | { kind: 'end'; programId: string }
  | { kind: 'cancel'; programId: string }
  /** El bloque desde el que se retoma; por defecto, en el que iba (D-083). */
  | { kind: 'restart'; programId: string; startsOn: string; blockId: string }
  | { kind: 'saveAsTemplate'; programId: string; name: string };

/** Las reglas de la base de datos que el coach puede encontrarse y entender. */
export const CLIENT_PROGRAM_ERRORS = [
  'client_not_found',
  'template_limit_reached',
  'program_already_ended',
  'program_already_started',
  'program_not_started',
  'invalid_start',
] as const;

export type ClientProgramActionResult =
  | { status: 'done'; id: string | null }
  | { status: (typeof CLIENT_PROGRAM_ERRORS)[number] | 'error' };

function call(action: ClientProgramAction, tenantId: string, today: string) {
  const client = getSupabaseClient();
  switch (action.kind) {
    case 'create':
      return client.rpc('create_client_program', {
        p_tenant: tenantId,
        p_client: action.clientId,
        p_name: action.name,
        p_cycle_days: action.cycleDays,
        p_starts_on: action.startsOn,
        p_mode: action.mode,
        p_today: today,
      });
    case 'end':
      return client.rpc('end_program', {
        p_tenant: tenantId,
        p_program: action.programId,
        p_today: today,
      });
    case 'cancel':
      return client.rpc('cancel_next_program', {
        p_tenant: tenantId,
        p_program: action.programId,
        p_today: today,
      });
    case 'restart':
      return client.rpc('restart_program', {
        p_tenant: tenantId,
        p_program: action.programId,
        p_starts_on: action.startsOn,
        p_block: action.blockId,
        p_today: today,
      });
    case 'saveAsTemplate':
      return client.rpc('save_program_as_template', {
        p_tenant: tenantId,
        p_program: action.programId,
        p_name: action.name,
      });
  }
}

export async function runClientProgramAction(
  tenantId: string,
  action: ClientProgramAction,
  today: string,
): Promise<ClientProgramActionResult> {
  const { data, error } = await call(action, tenantId, today);
  if (error === null) {
    return { status: 'done', id: typeof data === 'string' ? data : null };
  }
  const known = CLIENT_PROGRAM_ERRORS.find((name) => error.message === name);
  if (known !== undefined) {
    return { status: known };
  }
  // El mensaje es el nombre de una regla, sin datos personales.
  logger.error('Client program action failed', {
    action: action.kind,
    code: error.code,
    rule: error.message,
  });
  return { status: 'error' };
}
