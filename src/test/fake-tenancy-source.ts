import { DEFAULT_BRAND } from '@/core/branding';
import { normalizeInviteCode } from '@/core/tenancy';
import type {
  CreateBusinessResult,
  InvitePreview,
  JoinResult,
  MemberActionResult,
  Membership,
  PlanLimit,
  TenancySource,
  Tenant,
  TenantMember,
} from '@/core/tenancy';

// Espacios falsos para los tests: los mismos dos negocios que el seed de la base
// de datos (Iron Lab y Norte Strength), con su marca, y cuentas de cada caso.
// Todo es inventado. La lógica imita a la base de datos (mismos resultados).

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
    tenantName: tenant.name,
    tenant,
    ...overrides,
  };
}

const TENANTS_BY_ID = new Map<string, Tenant>(
  Object.values(TEST_TENANTS).map((tenant) => [tenant.id, tenant]),
);

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
  // Dueña de Norte Strength.
  'norte-coach@example.test': [member(TEST_TENANTS.norte, 'owner')],
};

/** El nombre de cada cuenta falsa (el perfil). */
export const FAKE_NAMES: Readonly<Record<string, string>> = {
  'coach@example.test': 'Iris Coach',
  'client@example.test': 'Ana Cliente',
  'norte-client@example.test': 'Diego Norte',
  'dual@example.test': 'Dana Dual',
  'archived@example.test': 'Fran Baja',
  'norte-coach@example.test': 'Nora Coach',
};

/** Planes falsos. Iron Lab tiene 1 plaza y ya está ocupada: su plan está lleno. */
const FAKE_PLANS: Readonly<Record<string, PlanLimit>> = {
  [TEST_TENANTS.iron.id]: { plan: 'free', maxClients: 1 },
  [TEST_TENANTS.norte.id]: { plan: 'starter', maxClients: 10 },
};

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  return Array.from(
    { length: 8 },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join('');
}

interface FakeTenancyOptions {
  memberships?: Readonly<Record<string, Membership[]>>;
  /** Simula que la base de datos no responde. */
  fail?: boolean;
  /** Quién tiene la sesión abierta (lo da `render-app.tsx`): hace falta para unirse. */
  currentEmail?: () => string | null;
}

export interface FakeTenancySource extends TenancySource {
  /** Cuántas veces se ha probado un código equivocado. */
  readonly failedAttempts: number;
}

const userIdFor = (email: string) => `user-${email}`;

/** Los ids de usuario de la sesión falsa son `user-<email>`. */
export function createFakeTenancySource({
  memberships = FAKE_MEMBERSHIPS,
  fail = false,
  currentEmail = () => null,
}: FakeTenancyOptions = {}): FakeTenancySource {
  // Copias propias: unirse o regenerar no tocan las listas compartidas.
  const store = new Map(Object.entries(memberships).map(([email, list]) => [email, [...list]]));
  const codes = new Map<string, Tenant>([
    ['IRONLAB1', TEST_TENANTS.iron],
    ['NORTE001', TEST_TENANTS.norte],
  ]);
  const tenants = new Map(TENANTS_BY_ID);
  const plans = new Map(Object.entries(FAKE_PLANS));
  let failedAttempts = 0;

  const findTenant = (code: string): Tenant | undefined => {
    const tenant = codes.get(normalizeInviteCode(code));
    if (tenant === undefined) {
      failedAttempts += 1;
    }
    return tenant;
  };
  const isLockedOut = () => failedAttempts >= 10;

  const membersOf = (tenantId: string): TenantMember[] =>
    [...store.entries()].flatMap(([email, list]) =>
      list
        .filter((membership) => membership.tenantId === tenantId)
        .map((membership) => ({
          userId: userIdFor(email),
          role: membership.role,
          status: membership.status,
          joinedAt: membership.joinedAt,
          displayName: FAKE_NAMES[email] ?? email.split('@')[0] ?? email,
        })),
    );

  const isFull = (tenantId: string) => {
    const limit = plans.get(tenantId)?.maxClients ?? null;
    const active = membersOf(tenantId).filter(
      (item) => item.role === 'client' && item.status === 'active',
    ).length;
    return limit !== null && active >= limit;
  };

  return {
    get failedAttempts() {
      return failedAttempts;
    },

    listMemberships(userId) {
      if (fail) {
        return Promise.reject(new Error('Could not load memberships: fake failure'));
      }
      const email = userId.replace(/^user-/, '');
      return Promise.resolve(store.get(email) ?? []);
    },

    previewInvite(code): Promise<InvitePreview> {
      if (isLockedOut()) {
        return Promise.resolve({ status: 'rate_limited' });
      }
      const tenant = findTenant(code);
      return Promise.resolve(
        tenant === undefined
          ? { status: 'invalid_code' }
          : { status: 'ok', name: tenant.name, branding: tenant.branding },
      );
    },

    joinWithCode(code): Promise<JoinResult> {
      const email = currentEmail();
      if (email === null) {
        return Promise.resolve({ status: 'error' });
      }
      if (isLockedOut()) {
        return Promise.resolve({ status: 'rate_limited' });
      }
      const tenant = findTenant(code);
      if (tenant === undefined) {
        return Promise.resolve({ status: 'invalid_code' });
      }
      const own = store.get(email) ?? [];
      const existing = own.find((membership) => membership.tenantId === tenant.id);
      if (existing !== undefined) {
        if (existing.role !== 'client') {
          return Promise.resolve({ status: 'own_business', tenantId: tenant.id });
        }
        return Promise.resolve(
          existing.status === 'active'
            ? { status: 'already_member', tenantId: tenant.id }
            : { status: 'archived' },
        );
      }
      if (isFull(tenant.id)) {
        return Promise.resolve({ status: 'plan_full' });
      }
      store.set(email, [...own, member(tenant, 'client', { joinedAt: new Date().toISOString() })]);
      return Promise.resolve({ status: 'joined', tenantId: tenant.id });
    },

    listMembers(tenantId) {
      return Promise.resolve(membersOf(tenantId));
    },

    getInviteCode(tenantId) {
      const code = [...codes.entries()].find(([, tenant]) => tenant.id === tenantId)?.[0];
      return Promise.resolve(code ?? null);
    },

    regenerateInviteCode(tenantId) {
      const email = currentEmail();
      const isOwner = (store.get(email ?? '') ?? []).some(
        (membership) => membership.tenantId === tenantId && membership.role === 'owner',
      );
      if (!isOwner) {
        return Promise.reject(new Error('not_allowed'));
      }
      for (const [code, tenant] of codes) {
        if (tenant.id === tenantId) {
          codes.delete(code);
          const next = randomCode();
          codes.set(next, tenant);
          return Promise.resolve(next);
        }
      }
      return Promise.reject(new Error('not_found'));
    },

    getPlanLimit(tenantId) {
      return Promise.resolve(plans.get(tenantId) ?? { plan: 'free', maxClients: 3 });
    },

    archiveClient: (tenantId, userId) => changeStatus(tenantId, userId, 'archived'),
    reactivateClient: (tenantId, userId) => changeStatus(tenantId, userId, 'active'),

    // Como create_tenant: un negocio por dueño, nombre de 2 a 40, condiciones
    // aceptadas; plan free (3 plazas) y la marca con el nombre (D-049).
    createBusiness(name, coachTermsVersion): Promise<CreateBusinessResult> {
      const email = currentEmail();
      if (email === null) {
        return Promise.resolve({ status: 'error' });
      }
      const trimmed = name.trim();
      if (coachTermsVersion.trim() === '') {
        return Promise.resolve({ status: 'terms_required' });
      }
      if (trimmed.length < 2 || trimmed.length > 40) {
        return Promise.resolve({ status: 'invalid_name' });
      }
      const own = store.get(email) ?? [];
      if (own.some((membership) => membership.role === 'owner')) {
        return Promise.resolve({ status: 'already_owner' });
      }
      const tenant: Tenant = {
        id: `tenant-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
        name: trimmed,
        branding: { ...DEFAULT_BRAND, appName: trimmed },
      };
      tenants.set(tenant.id, tenant);
      plans.set(tenant.id, { plan: 'free', maxClients: 3 });
      codes.set(randomCode(), tenant);
      store.set(email, [...own, member(tenant, 'owner', { joinedAt: new Date().toISOString() })]);
      return Promise.resolve({ status: 'created', tenantId: tenant.id });
    },

    // Como update_brand: solo el dueño; nombre de 2 a 40, colores #RRGGBB y modo
    // claro u oscuro. El nombre del negocio y el de la marca cambian a la vez.
    updateBrand(tenantId, { name, primary, accent, mode }) {
      const email = currentEmail() ?? '';
      const isOwner = (store.get(email) ?? []).some(
        (membership) => membership.tenantId === tenantId && membership.role === 'owner',
      );
      const current = tenants.get(tenantId);
      if (!isOwner || current === undefined) {
        return Promise.resolve('not_allowed');
      }
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 40) {
        return Promise.resolve('invalid_name');
      }
      const hex = /^#[0-9a-fA-F]{6}$/;
      if (!hex.test(primary) || !hex.test(accent)) {
        return Promise.resolve('invalid_color');
      }
      const next: Tenant = {
        id: tenantId,
        name: trimmed,
        branding: {
          ...current.branding,
          appName: trimmed,
          colors: { primary: primary.toUpperCase(), accent: accent.toUpperCase() },
          mode,
        },
      };
      tenants.set(tenantId, next);
      for (const [code, tenant] of codes) {
        if (tenant.id === tenantId) {
          codes.set(code, next);
        }
      }
      for (const [memberEmail, list] of store) {
        store.set(
          memberEmail,
          list.map((membership) =>
            membership.tenantId === tenantId
              ? {
                  ...membership,
                  tenantName: trimmed,
                  tenant: membership.tenant === null ? null : next,
                }
              : membership,
          ),
        );
      }
      return Promise.resolve('ok');
    },
  };

  // Como archive_client y reactivate_client: solo el dueño, solo a clientes, y
  // reactivar comprueba las plazas del plan (D-055).
  function changeStatus(
    tenantId: string,
    userId: string,
    next: 'active' | 'archived',
  ): Promise<MemberActionResult> {
    const ownerEmail = currentEmail() ?? '';
    const isOwner = (store.get(ownerEmail) ?? []).some(
      (membership) => membership.tenantId === tenantId && membership.role === 'owner',
    );
    if (!isOwner) {
      return Promise.resolve('not_allowed');
    }
    const email = userId.replace(/^user-/, '');
    const list = store.get(email) ?? [];
    const target = list.find(
      (membership) => membership.tenantId === tenantId && membership.role === 'client',
    );
    if (target === undefined || (next === 'archived' && target.status === 'archived')) {
      return Promise.resolve('not_found');
    }
    if (next === 'active' && target.status === 'archived' && isFull(tenantId)) {
      return Promise.resolve('plan_full');
    }
    store.set(
      email,
      list.map((membership) =>
        membership === target
          ? {
              ...membership,
              status: next,
              tenant: next === 'active' ? (tenants.get(tenantId) ?? null) : null,
            }
          : membership,
      ),
    );
    return Promise.resolve('ok');
  }
}
