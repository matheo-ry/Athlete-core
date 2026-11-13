import type { Brand } from '../branding';

export const ROLES = ['owner', 'staff', 'client'] as const;

/** Rol de un miembro dentro de un tenant (AGENTS.md §10). */
export type Role = (typeof ROLES)[number];

/** Las dos zonas de la app: `/coach/...` y `/client/...`. */
export type Profile = 'coach' | 'client';

export interface Tenant {
  id: string;
  name: string;
  branding: Brand;
}

/**
 * Tenant activo y papel del usuario en él. Van siempre juntos: o hay tenant, rol
 * y perfil, o el usuario todavía no pertenece a ningún tenant y no hay ninguno.
 */
export type Tenancy =
  { tenant: Tenant; role: Role; profile: Profile } | { tenant: null; role: null; profile: null };

export const NO_TENANCY: Tenancy = { tenant: null, role: null, profile: null };

export function profileForRole(role: Role): Profile {
  return role === 'client' ? 'client' : 'coach';
}
