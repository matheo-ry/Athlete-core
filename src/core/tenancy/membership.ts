import { z } from 'zod';

import { parseBrand } from '../branding/parse-brand';
import type { InvitePreview, JoinResult } from './invite';
import type { PlanLimit, TenantMember } from './members';
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
  /** El nombre del negocio: se sabe también si el usuario fue dado de baja (D-055). */
  tenantName: string;
  /** `null` si el usuario ya no puede ver ese negocio (dado de baja, D-055). */
  tenant: Tenant | null;
}

/** Cómo le va al usuario con un coach: 'ok', 'plan_full' al reactivar sin plazas… */
export type MemberActionResult =
  'ok' | 'plan_full' | 'not_allowed' | 'not_found' | 'offline' | 'error';

/** De dónde salen los espacios. En la app, de Supabase; en los tests, de una lista falsa. */
export interface TenancySource {
  listMemberships(userId: string): Promise<Membership[]>;
  /** A qué coach pertenece un código (D-051). Funciona sin sesión. */
  previewInvite(code: string): Promise<InvitePreview>;
  /** Unirse como cliente con el código (D-054). Necesita sesión. */
  joinWithCode(code: string): Promise<JoinResult>;
  /** Los miembros de un negocio, con su nombre (solo lo ve su coach, D-059). */
  listMembers(tenantId: string): Promise<TenantMember[]>;
  /** El código de invitación activo del negocio (solo lo ve su coach). */
  getInviteCode(tenantId: string): Promise<string | null>;
  /** Crea un código nuevo; el anterior deja de valer al instante (D-050). Solo el dueño. */
  regenerateInviteCode(tenantId: string): Promise<string>;
  getPlanLimit(tenantId: string): Promise<PlanLimit>;
  /** Dar de baja a un cliente (D-055). Solo el dueño. */
  archiveClient(tenantId: string, userId: string): Promise<MemberActionResult>;
  /** Reactivar a un cliente, si hay plaza en el plan (D-055). Solo el dueño. */
  reactivateClient(tenantId: string, userId: string): Promise<MemberActionResult>;
}

// Las filas de la función my_spaces. Son un dato de fuera: se validan (AGENTS.md §4).
const spaceRowSchema = z.object({
  tenant_id: z.string(),
  role: z.enum(ROLES),
  status: z.enum(['active', 'archived']),
  joined_at: z.string(),
  tenant_name: z.string(),
  // Solo llega en los espacios activos: de uno dado de baja solo se sabe el nombre.
  branding: z.unknown(),
});

export function parseMemberships(rows: unknown): Membership[] {
  return z
    .array(spaceRowSchema)
    .parse(rows)
    .map((row) => ({
      tenantId: row.tenant_id,
      role: row.role,
      status: row.status,
      joinedAt: row.joined_at,
      tenantName: row.tenant_name,
      tenant:
        row.status === 'active'
          ? { id: row.tenant_id, name: row.tenant_name, branding: parseBrand(row.branding) }
          : null,
    }));
}

/**
 * Si el usuario no tiene ningún espacio activo pero lo dieron de baja de
 * alguno, el nombre de ese coach (el más reciente), para decirle "Ya no tienes
 * acceso a …" (D-055). Si no, `null`.
 */
export function lostAccessTo(memberships: readonly Membership[]): string | null {
  if (activeMemberships(memberships).length > 0) {
    return null;
  }
  const archived = memberships
    .filter((membership) => membership.status === 'archived')
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  return archived[0]?.tenantName ?? null;
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
