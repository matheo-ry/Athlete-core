import { z } from 'zod';

import { parseBrand } from '../branding/parse-brand';
import type { InvitePreview, JoinResult } from './invite';
import { ROLES, profileForRole } from './tenancy-types';
import type { Role, Tenancy, Tenant } from './tenancy-types';

// Los "espacios" del usuario: cada negocio al que pertenece y con qué rol
// (DECISIONES D-048 y D-056). Lógica pura, sin React ni Supabase.

export type MembershipStatus = 'active' | 'archived';

export interface Membership {
  tenantId: string;
  role: Role;
  status: MembershipStatus;
  joinedAt: string;
  /** `null` si el usuario ya no puede ver ese negocio (dado de baja, D-055). */
  tenant: Tenant | null;
}

/** De dónde salen los espacios. En la app, de Supabase; en los tests, de una lista falsa. */
export interface TenancySource {
  listMemberships(userId: string): Promise<Membership[]>;
  /** A qué coach pertenece un código (D-051). Funciona sin sesión. */
  previewInvite(code: string): Promise<InvitePreview>;
  /** Unirse como cliente con el código (D-054). Necesita sesión. */
  joinWithCode(code: string): Promise<JoinResult>;
}

// Lo que devuelve la base de datos es un dato de fuera: se valida (AGENTS.md §4).
const membershipRowSchema = z.object({
  tenant_id: z.string(),
  role: z.enum(ROLES),
  status: z.enum(['active', 'archived']),
  created_at: z.string(),
  tenant: z.object({ id: z.string(), name: z.string(), branding: z.unknown() }).nullable(),
});

export function parseMemberships(rows: unknown): Membership[] {
  return z
    .array(membershipRowSchema)
    .parse(rows)
    .map((row) => ({
      tenantId: row.tenant_id,
      role: row.role,
      status: row.status,
      joinedAt: row.created_at,
      tenant:
        row.tenant === null
          ? null
          : { id: row.tenant.id, name: row.tenant.name, branding: parseBrand(row.tenant.branding) },
    }));
}

/** Espacios en los que el usuario puede entrar: activos y con el negocio visible. */
export function activeMemberships(memberships: readonly Membership[]): Membership[] {
  return memberships.filter((membership) => membership.status === 'active' && membership.tenant);
}

/**
 * En qué espacio se entra (D-056): el elegido, si sigue activo; si solo hay uno,
 * ese. Con varios y sin elección (hasta que llegue el selector, PR 1.14): el de
 * coach si existe y, si no, el más antiguo.
 */
export function pickActiveMembership(
  memberships: readonly Membership[],
  preferredTenantId: string | null = null,
): Membership | null {
  const active = activeMemberships(memberships);
  const preferred = active.find((membership) => membership.tenantId === preferredTenantId);
  if (preferred !== undefined) {
    return preferred;
  }
  const coach = active.find((membership) => membership.role !== 'client');
  if (coach !== undefined) {
    return coach;
  }
  return [...active].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0] ?? null;
}

export function tenancyFor(membership: Membership | null): Tenancy {
  if (membership === null || membership.tenant === null) {
    return { tenant: null, role: null, profile: null };
  }
  return {
    tenant: membership.tenant,
    role: membership.role,
    profile: profileForRole(membership.role),
  };
}

/** La pantalla de inicio que le toca a cada uno (D-056). */
export function homePathFor(tenancy: Tenancy): '/coach' | '/client' | '/welcome' {
  if (tenancy.profile === null) {
    return '/welcome';
  }
  return tenancy.profile === 'coach' ? '/coach' : '/client';
}
