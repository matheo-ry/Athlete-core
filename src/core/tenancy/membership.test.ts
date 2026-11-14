import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND } from '../branding/default-brand';
import {
  activeMemberships,
  homePathFor,
  lostAccessTo,
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
    tenantName: `Tenant ${overrides.tenantId}`,
    tenant: {
      id: overrides.tenantId,
      name: `Tenant ${overrides.tenantId}`,
      branding: DEFAULT_BRAND,
    },
    ...overrides,
  };
}

describe('parseMemberships', () => {
  it('convierte las filas de my_spaces y valida la marca', () => {
    const [first] = parseMemberships([
      {
        tenant_id: 't1',
        role: 'owner',
        status: 'active',
        joined_at: '2026-11-01T10:00:00Z',
        tenant_name: 'Iron Lab',
        branding: { broken: true },
      },
    ]);

    expect(first?.role).toBe('owner');
    expect(first?.tenant?.name).toBe('Iron Lab');
    // Una marca estropeada no rompe la app: se usa la de la plataforma.
    expect(first?.tenant?.branding).toEqual(DEFAULT_BRAND);
  });

  it('de un espacio dado de baja solo se sabe el nombre del coach (D-055)', () => {
    const [first] = parseMemberships([
      {
        tenant_id: 't1',
        role: 'client',
        status: 'archived',
        joined_at: '2026-11-01',
        tenant_name: 'Norte Strength',
        branding: null,
      },
    ]);
    expect(first?.tenant).toBeNull();
    expect(first?.tenantName).toBe('Norte Strength');
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

describe('lostAccessTo (D-055)', () => {
  it('sin espacios activos y dado de baja: el nombre del coach más reciente', () => {
    expect(
      lostAccessTo([
        membership({
          tenantId: 'a',
          status: 'archived',
          tenant: null,
          tenantName: 'Viejo',
          joinedAt: '2026-01-01',
        }),
        membership({
          tenantId: 'b',
          status: 'archived',
          tenant: null,
          tenantName: 'Norte',
          joinedAt: '2026-10-01',
        }),
      ]),
    ).toBe('Norte');
  });

  it('con algún espacio activo, o sin ninguno, no hay aviso', () => {
    expect(
      lostAccessTo([
        membership({ tenantId: 'a', status: 'archived', tenant: null }),
        membership({ tenantId: 'b' }),
      ]),
    ).toBeNull();
    expect(lostAccessTo([])).toBeNull();
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
