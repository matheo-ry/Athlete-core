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

export interface Tenancy {
  /** `null` cuando el usuario todavía no pertenece a ningún tenant. */
  tenant: Tenant | null;
  role: Role | null;
  profile: Profile | null;
}

export function profileForRole(role: Role): Profile {
  return role === 'client' ? 'client' : 'coach';
}
