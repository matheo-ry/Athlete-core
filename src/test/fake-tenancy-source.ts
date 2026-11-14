import type { Membership, TenancySource, Tenant } from '@/core/tenancy';

// Espacios falsos para los tests: los mismos dos negocios que el seed de la base
// de datos (Iron Lab y Norte Strength), con su marca, y cuentas de cada caso.

export const TEST_TENANTS = {
  iron: {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Iron Lab',
    branding: {
      appName: 'Iron Lab',
      logoPath: null,
      colors: { primary: '#DC2626', accent: '#F59E0B' },
      mode: 'dark',
    },
  },
  norte: {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Norte Strength',
    branding: {
      appName: 'Norte Strength',
      logoPath: null,
      colors: { primary: '#0F766E', accent: '#B45309' },
      mode: 'light',
    },
  },
} satisfies Record<string, Tenant>;

function member(
  tenant: Tenant,
  role: Membership['role'],
  overrides: Partial<Membership> = {},
): Membership {
  return {
    tenantId: tenant.id,
    role,
    status: 'active',
    joinedAt: '2026-11-01T10:00:00Z',
    tenant,
    ...overrides,
  };
}

/** Los espacios de cada cuenta de `fake-auth-service.ts`, por email. */
export const FAKE_MEMBERSHIPS: Readonly<Record<string, Membership[]>> = {
  'coach@example.test': [member(TEST_TENANTS.iron, 'owner')],
  'client@example.test': [member(TEST_TENANTS.iron, 'client')],
  'norte-client@example.test': [member(TEST_TENANTS.norte, 'client')],
  // Dueña de Iron Lab y, a la vez, clienta de Norte Strength (D-048).
  'dual@example.test': [
    member(TEST_TENANTS.norte, 'client', { joinedAt: '2026-10-01T10:00:00Z' }),
    member(TEST_TENANTS.iron, 'owner'),
  ],
  // Dado de baja de su único coach (D-055).
  'archived@example.test': [
    member(TEST_TENANTS.norte, 'client', { status: 'archived', tenant: null }),
  ],
};

interface FakeTenancyOptions {
  memberships?: Readonly<Record<string, Membership[]>>;
  /** Simula que la base de datos no responde. */
  fail?: boolean;
}

/** Los ids de usuario de la sesión falsa son `user-<email>`. */
export function createFakeTenancySource({
  memberships = FAKE_MEMBERSHIPS,
  fail = false,
}: FakeTenancyOptions = {}): TenancySource {
  return {
    listMemberships(userId) {
      if (fail) {
        return Promise.reject(new Error('Could not load memberships: fake failure'));
      }
      const email = userId.replace(/^user-/, '');
      return Promise.resolve(memberships[email] ?? []);
    },
  };
}
