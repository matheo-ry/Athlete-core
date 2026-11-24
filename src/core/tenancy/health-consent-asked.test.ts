import { beforeEach, describe, expect, it } from 'vitest';

import { markHealthConsentAsked, wasHealthConsentAsked } from './health-consent-asked';

describe('health-consent-asked', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('al principio no se ha preguntado a nadie', () => {
    expect(wasHealthConsentAsked('user-1', 'tenant-1')).toBe(false);
  });

  it('se recuerda por usuario y por negocio', () => {
    markHealthConsentAsked('user-1', 'tenant-1');
    expect(wasHealthConsentAsked('user-1', 'tenant-1')).toBe(true);
    expect(wasHealthConsentAsked('user-1', 'tenant-2')).toBe(false);
    expect(wasHealthConsentAsked('user-2', 'tenant-1')).toBe(false);
  });

  it('marcar dos veces no duplica la entrada', () => {
    markHealthConsentAsked('user-1', 'tenant-1');
    markHealthConsentAsked('user-1', 'tenant-1');
    expect(JSON.parse(localStorage.getItem('athlete-core.healthConsentAsked') ?? '[]')).toEqual([
      'user-1/tenant-1',
    ]);
  });

  it('un contenido estropeado se ignora', () => {
    localStorage.setItem('athlete-core.healthConsentAsked', '{no es json');
    expect(wasHealthConsentAsked('user-1', 'tenant-1')).toBe(false);
  });
});
