import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearPendingSignup, readPendingSignup, rememberPendingSignup } from './pending-signup';

const PROFILE = {
  displayName: 'Ana',
  locale: 'es' as const,
  weightUnit: 'kg' as const,
  termsVersion: 'draft-2026-11',
};

afterEach(() => {
  clearPendingSignup();
  vi.useRealTimers();
});

describe('registro pendiente de confirmar', () => {
  it('recuerda en memoria el email, la contraseña y los datos', () => {
    rememberPendingSignup({ email: 'ana@example.test', password: 'secret-123', profile: PROFILE });
    expect(readPendingSignup()).toEqual({
      email: 'ana@example.test',
      password: 'secret-123',
      profile: PROFILE,
    });
  });

  it('en el dispositivo solo guarda el email, nunca la contraseña', () => {
    rememberPendingSignup({ email: 'ana@example.test', password: 'secret-123', profile: PROFILE });
    const stored = localStorage.getItem('athlete-core.pendingEmail') ?? '';
    expect(stored).toContain('ana@example.test');
    expect(stored).not.toContain('secret-123');
  });

  it('el email guardado caduca a las 24 horas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T10:00:00Z'));
    localStorage.setItem(
      'athlete-core.pendingEmail',
      JSON.stringify({ email: 'old@example.test', at: Date.now() - 25 * 60 * 60 * 1000 }),
    );
    expect(readPendingSignup()).toBeNull();
  });

  it('con solo el email guardado, no se sabe la contraseña', () => {
    localStorage.setItem(
      'athlete-core.pendingEmail',
      JSON.stringify({ email: 'ana@example.test', at: Date.now() }),
    );
    expect(readPendingSignup()).toEqual({
      email: 'ana@example.test',
      password: null,
      profile: null,
    });
  });
});
