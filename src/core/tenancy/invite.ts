import { z } from 'zod';

import { parseBrand } from '../branding/parse-brand';
import type { Brand } from '../branding/brand-schema';

// Lo que responden la vista previa de un código y unirse con él (DECISIONES
// D-051 y D-054). Viene de la base de datos: se valida (AGENTS.md §4).

/** 'offline' y 'error' los pone la app: no hubo conexión o falló algo inesperado. */
export type InvitePreview =
  | { status: 'ok'; name: string; branding: Brand }
  | { status: 'invalid_code' | 'rate_limited' | 'offline' | 'error' };

export type JoinResult =
  | { status: 'joined' | 'already_member' | 'own_business'; tenantId: string }
  | { status: 'archived' | 'plan_full' | 'invalid_code' | 'rate_limited' | 'offline' | 'error' };

const previewSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), name: z.string(), branding: z.unknown() }),
  z.object({ status: z.enum(['invalid_code', 'rate_limited']) }),
]);

export function parseInvitePreview(data: unknown): InvitePreview {
  const result = previewSchema.safeParse(data);
  if (!result.success) {
    return { status: 'error' };
  }
  const value = result.data;
  return value.status === 'ok'
    ? { status: 'ok', name: value.name, branding: parseBrand(value.branding) }
    : { status: value.status };
}

const joinSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.enum(['joined', 'already_member', 'own_business']),
    tenant_id: z.string(),
  }),
  z.object({ status: z.enum(['archived', 'plan_full', 'invalid_code', 'rate_limited']) }),
]);

export function parseJoinResult(data: unknown): JoinResult {
  const result = joinSchema.safeParse(data);
  if (!result.success) {
    return { status: 'error' };
  }
  const value = result.data;
  return 'tenant_id' in value
    ? { status: value.status, tenantId: value.tenant_id }
    : { status: value.status };
}
