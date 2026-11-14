import { z } from 'zod';

import { isNetworkError } from '../../auth/auth-errors';
import { LOGO_BUCKET, checkLogoFile, logoPathFor } from '../../branding/logo';
import { logger } from '../../lib';
import { getSupabaseClient } from '../../supabase';
import { normalizeInviteCode } from '../invite-code';
import { parseInvitePreview, parseJoinResult } from '../invite';
import { parseMembers, parsePlanLimit } from '../members';
import { parseMemberships } from '../membership';
import type { MemberActionResult, TenancySource } from '../membership';

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
    // Los espacios del usuario que tiene la sesión (my_spaces solo devuelve los
    // suyos). De uno dado de baja llega solo el nombre del coach (D-055). El id
    // del usuario solo sirve para la caché: la base de datos lo saca de la sesión.
    async listMemberships() {
      const { data, error } = await getSupabaseClient().rpc('my_spaces');
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

    // Las consultas de un coach. El RLS solo deja ver los miembros, los perfiles
    // y el código de los negocios donde es owner o staff.
    async listMembers(tenantId) {
      const client = getSupabaseClient();
      const members = await client
        .from('tenant_members')
        .select('user_id, role, status, created_at')
        .eq('tenant_id', tenantId);
      if (members.error !== null) {
        throw new Error(`Could not load members: ${members.error.code}`);
      }
      const profiles = await client
        .from('profiles')
        .select('user_id, display_name')
        .in(
          'user_id',
          members.data.map((row) => row.user_id),
        );
      if (profiles.error !== null) {
        throw new Error(`Could not load member profiles: ${profiles.error.code}`);
      }
      return parseMembers(members.data, profiles.data);
    },

    async getInviteCode(tenantId) {
      const { data, error } = await getSupabaseClient()
        .from('tenant_invites')
        .select('code')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle();
      if (error !== null) {
        throw new Error(`Could not load invite code: ${error.code}`);
      }
      return data?.code ?? null;
    },

    async regenerateInviteCode(tenantId) {
      const { data, error } = await getSupabaseClient().rpc('regenerate_invite_code', {
        p_tenant: tenantId,
      });
      if (error !== null) {
        throw new Error(`Could not regenerate invite code: ${error.code}`);
      }
      return z.string().parse(data);
    },

    async getPlanLimit(tenantId) {
      const { data, error } = await getSupabaseClient()
        .from('tenants')
        .select('plan, plans(max_clients)')
        .eq('id', tenantId)
        .single();
      if (error !== null) {
        throw new Error(`Could not load plan: ${error.code}`);
      }
      return parsePlanLimit(data);
    },

    async archiveClient(tenantId, userId) {
      const { error } = await getSupabaseClient().rpc('archive_client', {
        p_tenant: tenantId,
        p_user: userId,
      });
      return error === null ? 'ok' : memberActionFailure(error, 'archive client');
    },

    async createBusiness(name, coachTermsVersion) {
      const { data, error } = await getSupabaseClient().rpc('create_tenant', {
        p_name: name,
        p_coach_terms_version: coachTermsVersion,
      });
      if (error === null) {
        return { status: 'created', tenantId: z.string().parse(data) };
      }
      if (
        error.message === 'already_owner' ||
        error.message === 'invalid_name' ||
        error.message === 'terms_required'
      ) {
        return { status: error.message };
      }
      return failureStatus(error, 'create business');
    },

    async reactivateClient(tenantId, userId) {
      const { error } = await getSupabaseClient().rpc('reactivate_client', {
        p_tenant: tenantId,
        p_user: userId,
      });
      return error === null ? 'ok' : memberActionFailure(error, 'reactivate client');
    },

    // update_brand valida otra vez el nombre, los colores y el modo, y solo deja
    // al dueño (D-057).
    async updateBrand(tenantId, { name, primary, accent, mode }) {
      const { error } = await getSupabaseClient().rpc('update_brand', {
        p_tenant: tenantId,
        p_name: name,
        p_primary: primary,
        p_accent: accent,
        p_mode: mode,
      });
      if (error === null) {
        return 'ok';
      }
      if (
        error.message === 'invalid_name' ||
        error.message === 'invalid_color' ||
        error.message === 'not_allowed'
      ) {
        return error.message;
      }
      return failureStatus(error, 'update brand').status;
    },

    // El logo va en Storage, en la carpeta del negocio, con un nombre nuevo cada
    // vez (D-057). Storage vuelve a comprobar el formato y el tamaño, y que es
    // el dueño. Después set_logo lo apunta en la marca.
    async saveLogo(tenantId, file) {
      const problem = checkLogoFile(file);
      const path = logoPathFor(tenantId, file.type, crypto.randomUUID());
      if (problem !== null || path === null) {
        return { status: problem ?? 'invalid_type' };
      }
      const client = getSupabaseClient();
      const upload = await client.storage
        .from(LOGO_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error !== null) {
        return { status: storageFailure(upload.error, 'upload logo') };
      }
      const { error } = await client.rpc('set_logo', { p_tenant: tenantId, p_path: path });
      if (error !== null) {
        // Sin apuntarlo en la marca, el archivo no sirve: se borra.
        await client.storage.from(LOGO_BUCKET).remove([path]);
        return {
          status:
            error.message === 'not_allowed'
              ? 'not_allowed'
              : failureStatus(error, 'set logo').status,
        };
      }
      return { status: 'ok', path };
    },

    async removeLogo(tenantId) {
      const { error } = await getSupabaseClient().rpc('remove_logo', { p_tenant: tenantId });
      if (error === null) {
        return 'ok';
      }
      return error.message === 'not_allowed'
        ? 'not_allowed'
        : failureStatus(error, 'remove logo').status;
    },

    async deleteLogoFile(path) {
      const { error } = await getSupabaseClient().storage.from(LOGO_BUCKET).remove([path]);
      if (error !== null) {
        // El logo ya no se ve; solo queda un archivo de más en Storage.
        logger.warn('Tenancy: could not delete an old logo file', { status: error.status });
      }
    },
  };
}

interface StorageFailure {
  message: string;
  status?: number | undefined;
  statusCode?: string | undefined;
}

/** Los errores de Storage al subir un logo, con los motivos que entiende la app. */
function storageFailure(
  error: StorageFailure,
  action: string,
): 'too_large' | 'invalid_type' | 'not_allowed' | 'offline' | 'error' {
  const status = error.status ?? Number(error.statusCode ?? 0);
  if (status === 413 || /maximum allowed size/i.test(error.message)) {
    return 'too_large';
  }
  if (status === 415 || /mime type/i.test(error.message)) {
    return 'invalid_type';
  }
  if (status === 403 || /row-level security/i.test(error.message)) {
    return 'not_allowed';
  }
  if (isNetworkError(error)) {
    return 'offline';
  }
  logger.error(`Tenancy: ${action} failed`, { status });
  return 'error';
}

/** Los errores de dar de baja y reactivar, con los motivos que entiende la app. */
function memberActionFailure(error: RpcError, action: string): MemberActionResult {
  switch (error.message) {
    case 'plan_limit_reached':
      return 'plan_full';
    case 'not_allowed':
      return 'not_allowed';
    case 'not_found':
      return 'not_found';
    default:
      return failureStatus(error, action).status;
  }
}
