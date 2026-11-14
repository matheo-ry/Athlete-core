import { z } from 'zod';

import { ROLES } from './tenancy-types';
import type { Role } from './tenancy-types';

// Los miembros de un negocio, vistos por su coach (DECISIONES D-059). La lista
// la da core/tenancy para que ningún módulo tenga que depender de `clients`
// para elegir a un cliente (ARQUITECTURA §6). No lleva el email: el coach no lo ve.

export interface TenantMember {
  userId: string;
  role: Role;
  status: 'active' | 'archived';
  joinedAt: string;
  displayName: string;
}

/** El plan del negocio y su límite de clientes (`null` = sin límite, D-017). */
export interface PlanLimit {
  plan: string;
  maxClients: number | null;
}

const memberRowSchema = z.object({
  user_id: z.string(),
  role: z.enum(ROLES),
  status: z.enum(['active', 'archived']),
  created_at: z.string(),
});

const profileRowSchema = z.object({ user_id: z.string(), display_name: z.string() });

/** Junta las filas de miembros con los nombres de sus perfiles. */
export function parseMembers(memberRows: unknown, profileRows: unknown): TenantMember[] {
  const names = new Map(
    z
      .array(profileRowSchema)
      .parse(profileRows)
      .map((row) => [row.user_id, row.display_name]),
  );
  return z
    .array(memberRowSchema)
    .parse(memberRows)
    .map((row) => ({
      userId: row.user_id,
      role: row.role,
      status: row.status,
      joinedAt: row.created_at,
      displayName: names.get(row.user_id) ?? '',
    }));
}

const planRowSchema = z.object({
  plan: z.string(),
  plans: z.object({ max_clients: z.number().int().nullable() }).nullable(),
});

export function parsePlanLimit(row: unknown): PlanLimit {
  const parsed = planRowSchema.parse(row);
  return { plan: parsed.plan, maxClients: parsed.plans?.max_clients ?? null };
}

/** Clientes activos: los que ocupan plaza en el plan. */
export function countActiveClients(members: readonly TenantMember[]): number {
  return members.filter((member) => member.role === 'client' && member.status === 'active').length;
}
