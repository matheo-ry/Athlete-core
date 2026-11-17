import { describe, expect, it } from 'vitest';

import { storedSessionUser } from './offline-session';

describe('storedSessionUser', () => {
  it('devuelve el usuario de la sesión guardada', () => {
    const raw = JSON.stringify({
      access_token: 'expired',
      refresh_token: 'refresh',
      user: { id: 'user-1', email: 'ana@example.com' },
    });

    expect(storedSessionUser(raw)).toEqual({ id: 'user-1', email: 'ana@example.com' });
  });

  it('sin sesión guardada, o si no tiene con qué renovarse, no hay usuario', () => {
    expect(storedSessionUser(null)).toBeNull();
    expect(storedSessionUser('{roto')).toBeNull();
    expect(storedSessionUser(JSON.stringify({ user: { id: 'user-1' } }))).toBeNull();
    expect(storedSessionUser(JSON.stringify({ refresh_token: 'r' }))).toBeNull();
  });
});
