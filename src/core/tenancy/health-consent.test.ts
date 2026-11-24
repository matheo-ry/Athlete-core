import { describe, expect, it } from 'vitest';

import { isHealthConsentGranted, parseHealthConsent, shouldPromptOnEntry } from './health-consent';

const GRANTED_ROW = {
  granted_at: '2026-11-16T10:00:00+00:00',
  text_version: '2026-11-draft',
  withdrawn_at: null,
};

describe('parseHealthConsent', () => {
  it('sin fila, nunca se le ha pedido', () => {
    expect(parseHealthConsent(null)).toEqual({ status: 'none' });
  });

  it('con fila y sin retirar, está dado', () => {
    expect(parseHealthConsent(GRANTED_ROW)).toEqual({
      status: 'granted',
      grantedAt: '2026-11-16T10:00:00+00:00',
      textVersion: '2026-11-draft',
    });
  });

  it('con la fecha de retirada, está retirado', () => {
    const row = { ...GRANTED_ROW, withdrawn_at: '2026-11-20T08:00:00+00:00' };
    expect(parseHealthConsent(row)).toEqual({
      status: 'withdrawn',
      withdrawnAt: '2026-11-20T08:00:00+00:00',
    });
  });

  it('un dato que no cuadra no se lee como "sin consentimiento"', () => {
    expect(() => parseHealthConsent({ granted_at: 5 })).toThrow();
  });
});

describe('isHealthConsentGranted', () => {
  it('solo es verdad con el consentimiento vigente', () => {
    expect(isHealthConsentGranted(parseHealthConsent(GRANTED_ROW))).toBe(true);
    expect(isHealthConsentGranted({ status: 'none' })).toBe(false);
    expect(isHealthConsentGranted({ status: 'withdrawn', withdrawnAt: 'x' })).toBe(false);
    expect(isHealthConsentGranted(undefined)).toBe(false);
  });
});

describe('shouldPromptOnEntry', () => {
  it('pregunta a quien nunca lo ha dado y no se le ha preguntado en este dispositivo', () => {
    expect(shouldPromptOnEntry({ status: 'none' }, false)).toBe(true);
  });

  it('no insiste tras "Ahora no"', () => {
    expect(shouldPromptOnEntry({ status: 'none' }, true)).toBe(false);
  });

  it('no pregunta mientras carga ni a quien ya lo dio o lo retiró', () => {
    expect(shouldPromptOnEntry(undefined, false)).toBe(false);
    expect(shouldPromptOnEntry(parseHealthConsent(GRANTED_ROW), false)).toBe(false);
    expect(shouldPromptOnEntry({ status: 'withdrawn', withdrawnAt: 'x' }, false)).toBe(false);
  });
});
