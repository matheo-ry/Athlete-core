import { describe, expect, it } from 'vitest';

import type { TenantMember } from '@/core/tenancy';

import { isNewClient, visibleClients } from './client-list';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);

function client(displayName: string, overrides: Partial<TenantMember> = {}): TenantMember {
  return {
    userId: displayName,
    role: 'client',
    status: 'active',
    joinedAt: '2026-11-01T10:00:00Z',
    displayName,
    ...overrides,
  };
}

const MEMBERS = [
  client('Carla Demo'),
  client('ana Ejemplo'),
  client('Bruno Prueba'),
  client('José Pérez', { status: 'archived' }),
  client('La Coach', { role: 'owner' }),
];

describe('visibleClients (D-059)', () => {
  it('los activos, por orden alfabético y sin el coach', () => {
    expect(visibleClients(MEMBERS, 'active', '', 'es').map((item) => item.displayName)).toEqual([
      'ana Ejemplo',
      'Bruno Prueba',
      'Carla Demo',
    ]);
  });

  it('la pestaña de dados de baja', () => {
    expect(visibleClients(MEMBERS, 'archived', '', 'es').map((item) => item.displayName)).toEqual([
      'José Pérez',
    ]);
  });

  it('busca por nombre sin importar mayúsculas ni tildes', () => {
    expect(visibleClients(MEMBERS, 'active', 'BRU', 'es').map((item) => item.displayName)).toEqual([
      'Bruno Prueba',
    ]);
    expect(visibleClients(MEMBERS, 'archived', 'jose perez', 'es')).toHaveLength(1);
    expect(visibleClients(MEMBERS, 'active', 'zzz', 'es')).toEqual([]);
  });
});

describe('isNewClient', () => {
  it('es "Nuevo" durante 7 días', () => {
    expect(isNewClient(new Date(NOW - 6 * DAY).toISOString(), NOW)).toBe(true);
    expect(isNewClient(new Date(NOW - 8 * DAY).toISOString(), NOW)).toBe(false);
  });

  it('una fecha rota no cuenta como nuevo', () => {
    expect(isNewClient('not a date', NOW)).toBe(false);
  });
});
