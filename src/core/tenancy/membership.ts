import { z } from 'zod';

import type { BrandMode } from '../branding/brand-schema';
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
  /** Crear el negocio del usuario, que pasa a ser su dueño (D-049 y D-060). */
  createBusiness(name: string, coachTermsVersion: string): Promise<CreateBusinessResult>;
  /** Guardar el nombre, los colores y el modo del negocio (D-057). Solo el dueño. */
  updateBrand(tenantId: string, input: BrandInput): Promise<UpdateBrandResult>;
  /** Subir un logo nuevo y apuntarlo en la marca (D-057). Solo el dueño. */
  saveLogo(tenantId: string, file: File): Promise<SaveLogoResult>;
  /** Quitar el logo de la marca: se vuelven a ver las iniciales. Solo el dueño. */
  removeLogo(tenantId: string): Promise<'ok' | 'not_allowed' | 'offline' | 'error'>;
  /** Borrar el archivo de un logo que ya no se usa. Si falla, solo se registra. */
  deleteLogoFile(path: string): Promise<void>;
}

export type SaveLogoResult =
  | { status: 'ok'; path: string }
  | { status: 'too_large' | 'invalid_type' | 'not_allowed' | 'offline' | 'error' };

/** Lo que el coach cambia de su marca. El nombre es a la vez el del negocio y el de la marca. */
export interface BrandInput {
  name: string;
  primary: string;
  accent: string;
  mode: BrandMode;
}

export type UpdateBrandResult =
  | 'ok'
  | 'invalid_name'
  | 'invalid_color'
  | 'logo_too_large'
  | 'logo_invalid_type'
  | 'not_allowed'
  | 'offline'
  | 'error';

/** Qué pasa con el logo al guardar la marca: se deja, se cambia por otro o se quita. */
export type LogoChange = { kind: 'keep' } | { kind: 'replace'; file: File } | { kind: 'remove' };

export type CreateBusinessResult =
  | { status: 'created'; tenantId: string }
  | { status: 'already_owner' | 'invalid_name' | 'terms_required' | 'offline' | 'error' };

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
 * En qué espacio se entra (D-056): el elegido (o el último usado en este
 * dispositivo), si sigue activo; si solo hay uno, ese. Con varios y sin
 * elección, ninguno: hay que elegir en el selector (`needsSpaceChoice`).
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
  return active.length === 1 ? (active[0] ?? null) : null;
}

/** ¿Tiene varios espacios y ninguno elegido? Entonces va al selector (D-056). */
export function needsSpaceChoice(
  memberships: readonly Membership[],
  preferredTenantId: string | null = null,
): boolean {
  return (
    activeMemberships(memberships).length > 1 &&
    pickActiveMembership(memberships, preferredTenantId) === null
  );
}

/**
 * Los espacios activos en el orden en que se enseñan: primero el negocio propio
 * y después los coaches, del más antiguo al más nuevo.
 */
export function sortedSpaces(memberships: readonly Membership[]): Membership[] {
  return activeMemberships(memberships).sort((a, b) => {
    const ownA = a.role === 'client' ? 1 : 0;
    const ownB = b.role === 'client' ? 1 : 0;
    return ownA - ownB || a.joinedAt.localeCompare(b.joinedAt);
  });
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

export type HomePath = '/coach' | '/client' | '/welcome' | '/select';

/**
 * La pantalla de inicio que le toca a cada uno (D-056): su zona; el selector
 * si tiene varios espacios y ninguno elegido; la bienvenida si no tiene ninguno.
 */
export function homePathFor(tenancy: Tenancy, mustChoose = false): HomePath {
  if (tenancy.profile !== null) {
    return tenancy.profile === 'coach' ? '/coach' : '/client';
  }
  return mustChoose ? '/select' : '/welcome';
}

/** La zona de un espacio: la de coach para el dueño o el staff; la de cliente, si no. */
export function homePathOf(membership: Membership): '/coach' | '/client' {
  return profileForRole(membership.role) === 'coach' ? '/coach' : '/client';
}
