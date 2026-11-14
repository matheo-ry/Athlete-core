import { isNetworkError } from '../../auth/auth-errors';
import { logger } from '../../lib';
import { getSupabaseClient } from '../../supabase';
import { normalizeInviteCode } from '../invite-code';
import { parseInvitePreview, parseJoinResult } from '../invite';
import { parseMemberships } from '../membership';
import type { TenancySource } from '../membership';

interface RpcError {
  code?: string;
  message?: string;
}

function failureStatus(error: RpcError, action: string): { status: 'offline' | 'error' } {
  if (isNetworkError(error)) {
    return { status: 'offline' };
  }
  // Sin datos personales: solo el código técnico.
  logger.error(`Tenancy: ${action} failed`, { code: error.code });
  return { status: 'error' };
}

export function createSupabaseTenancySource(): TenancySource {
  return {
    // Los espacios del usuario. No hace falta filtrar por tenant a mano: el RLS
    // solo deja ver las filas propias de tenant_members, y el negocio solo si el
    // usuario es miembro activo (por eso un espacio dado de baja llega sin negocio).
    async listMemberships(userId) {
      const { data, error } = await getSupabaseClient()
        .from('tenant_members')
        .select('tenant_id, role, status, created_at, tenant:tenants(id, name, branding)')
        .eq('user_id', userId)
        .order('created_at');
      if (error !== null) {
        // El registro lo hace la caché de TanStack Query (app/query-client.ts).
        throw new Error(`Could not load memberships: ${error.code}`);
      }
      return parseMemberships(data);
    },

    async previewInvite(code) {
      const { data, error } = await getSupabaseClient().rpc('preview_invite', {
        p_code: normalizeInviteCode(code),
      });
      return error === null ? parseInvitePreview(data) : failureStatus(error, 'preview invite');
    },

    async joinWithCode(code) {
      const { data, error } = await getSupabaseClient().rpc('join_tenant_with_code', {
        p_code: normalizeInviteCode(code),
      });
      return error === null ? parseJoinResult(data) : failureStatus(error, 'join with code');
    },
  };
}
