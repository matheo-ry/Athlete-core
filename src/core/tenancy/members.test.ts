import { describe, expect, it } from 'vitest';

import { countActiveClients, parseMembers, parsePlanLimit } from './members';

describe('parseMembers', () => {
  it('junta cada miembro con su nombre, sin el email', () => {
    const members = parseMembers(
      [
        { user_id: 'u1', role: 'client', status: 'active', created_at: '2026-11-01' },
        { user_id: 'u2', role: 'owner', status: 'active', created_at: '2026-10-01' },
      ],
      [{ user_id: 'u1', display_name: 'Ana' }],
    );
    expect(members).toEqual([
      {
        userId: 'u1',
        role: 'client',
        status: 'active',
        joinedAt: '2026-11-01',
        displayName: 'Ana',
      },
      { userId: 'u2', role: 'owner', status: 'active', joinedAt: '2026-10-01', displayName: '' },
    ]);
  });
});

describe('parsePlanLimit', () => {
  it('lee el plan y su límite; sin límite es null', () => {
    expect(parsePlanLimit({ plan: 'free', plans: { max_clients: 3 } })).toEqual({
      plan: 'free',
      maxClients: 3,
    });
    expect(parsePlanLimit({ plan: 'studio', plans: { max_clients: null } }).maxClients).toBeNull();
  });
});

describe('countActiveClients', () => {
  it('solo cuentan los clientes activos: ni el coach ni los dados de baja', () => {
    const base = { joinedAt: '2026-11-01', displayName: 'x' };
    expect(
      countActiveClients([
        { ...base, userId: 'a', role: 'client', status: 'active' },
        { ...base, userId: 'b', role: 'client', status: 'archived' },
        { ...base, userId: 'c', role: 'owner', status: 'active' },
      ]),
    ).toBe(1);
  });
});
