import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND } from '../branding/default-brand';
import {
  activeMemberships,
  homePathFor,
  parseMemberships,
  pickActiveMembership,
  tenancyFor,
} from './membership';
import type { Membership } from './membership';

function membership(overrides: Partial<Membership> & Pick<Membership, 'tenantId'>): Membership {
  return {
    role: 'client',
    status: 'active',
    joinedAt: '2026-11-01T10:00:00Z',
    tenant: {
      id: overrides.tenantId,
      name: `Tenant ${overrides.tenantId}`,
      branding: DEFAULT_BRAND,
    },
    ...overrides,
  };
}

describe('parseMemberships', () => {
  it('convierte las filas de la base de datos y valida la marca', () => {
    const [first] = parseMemberships([
      {
        tenant_id: 't1',
        role: 'owner',
        status: 'active',
        created_at: '2026-11-01T10:00:00Z',
        tenant: { id: 't1', name: 'Iron Lab', branding: { broken: true } },
      },
    ]);

    expect(first?.role).toBe('owner');
    expect(first?.tenant?.name).toBe('Iron Lab');
    // Una marca estropeada no rompe la app: se usa la de la plataforma.
    expect(first?.tenant?.branding).toEqual(DEFAULT_BRAND);
  });

  it('un espacio dado de baja llega sin negocio visible', () => {
    const [first] = parseMemberships([
      {
        tenant_id: 't1',
        role: 'client',
        status: 'archived',
        created_at: '2026-11-01',
        tenant: null,
      },
    ]);
    expect(first?.tenant).toBeNull();
  });

  it('falla si la fila no tiene la forma esperada', () => {
    expect(() => parseMemberships([{ tenant_id: 't1', role: 'admin' }])).toThrow();
  });
});

describe('pickActiveMembership (D-056)', () => {
  it('sin espacios activos no se entra en ninguno', () => {
    expect(pickActiveMembership([])).toBeNull();
    expect(pickActiveMembership([membership({ tenantId: 'a', status: 'archived' })])).toBeNull();
  });

  it('con un solo espacio, ese', () => {
    expect(pickActiveMembership([membership({ tenantId: 'a' })])?.tenantId).toBe('a');
  });

  it('con varios, el de coach antes que los de cliente', () => {
    const list = [
      membership({ tenantId: 'client-of' }),
      membership({ tenantId: 'mine', role: 'owner' }),
    ];
    expect(pickActiveMembership(list)?.tenantId).toBe('mine');
  });

  it('con varios de cliente, el más antiguo', () => {
    const list = [
      membership({ tenantId: 'new', joinedAt: '2026-11-10T00:00:00Z' }),
      membership({ tenantId: 'old', joinedAt: '2026-10-01T00:00:00Z' }),
    ];
    expect(pickActiveMembership(list)?.tenantId).toBe('old');
  });

  it('respeta el elegido si sigue activo, y lo ignora si no', () => {
    const list = [
      membership({ tenantId: 'mine', role: 'owner' }),
      membership({ tenantId: 'other' }),
    ];
    expect(pickActiveMembership(list, 'other')?.tenantId).toBe('other');
    expect(pickActiveMembership(list, 'gone')?.tenantId).toBe('mine');
  });

  it('activeMemberships deja fuera los dados de baja', () => {
    const list = [membership({ tenantId: 'a' }), membership({ tenantId: 'b', status: 'archived' })];
    expect(activeMemberships(list).map((item) => item.tenantId)).toEqual(['a']);
  });
});

describe('homePathFor', () => {
  it('lleva a cada uno a su zona, o a la bienvenida si no tiene espacio', () => {
    expect(homePathFor(tenancyFor(membership({ tenantId: 'a', role: 'owner' })))).toBe('/coach');
    expect(homePathFor(tenancyFor(membership({ tenantId: 'a', role: 'staff' })))).toBe('/coach');
    expect(homePathFor(tenancyFor(membership({ tenantId: 'a', role: 'client' })))).toBe('/client');
    expect(homePathFor(tenancyFor(null))).toBe('/welcome');
  });
});
