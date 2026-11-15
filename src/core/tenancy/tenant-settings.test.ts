import { describe, expect, it } from 'vitest';

import { mergeTenantSettings, parseTenantSettings } from './tenant-settings';

describe('los ajustes del negocio (D-076)', () => {
  it('por defecto, el coach trabaja con RIR', () => {
    expect(parseTenantSettings({})).toEqual({ intensityScale: 'rir' });
    expect(parseTenantSettings(null)).toEqual({ intensityScale: 'rir' });
    expect(parseTenantSettings('roto')).toEqual({ intensityScale: 'rir' });
    expect(parseTenantSettings({ intensityScale: 'otra' })).toEqual({ intensityScale: 'rir' });
  });

  it('lee la escala guardada', () => {
    expect(parseTenantSettings({ intensityScale: 'rpe' })).toEqual({ intensityScale: 'rpe' });
  });

  it('al guardar un ajuste conserva los demás, también los que no conoce', () => {
    expect(
      mergeTenantSettings({ futuro: 1, intensityScale: 'rir' }, { intensityScale: 'rpe' }),
    ).toEqual({
      futuro: 1,
      intensityScale: 'rpe',
    });
    expect(mergeTenantSettings(null, { intensityScale: 'rpe' })).toEqual({ intensityScale: 'rpe' });
    expect(mergeTenantSettings([1], { intensityScale: 'rpe' })).toEqual({ intensityScale: 'rpe' });
  });
});
