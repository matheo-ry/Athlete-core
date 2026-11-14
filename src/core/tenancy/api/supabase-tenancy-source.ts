import { getSupabaseClient } from '../../supabase';
import { parseMemberships } from '../membership';
import type { TenancySource } from '../membership';

// Los espacios del usuario, de la base de datos. No hace falta filtrar por
// tenant a mano: el RLS solo deja ver las filas propias de tenant_members, y el
// negocio solo si el usuario es miembro activo (por eso un espacio dado de baja
// llega con `tenant` vacío).
export function createSupabaseTenancySource(): TenancySource {
  return {
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
  };
}
