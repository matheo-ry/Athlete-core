import { describe, expect, it } from 'vitest';

import { brandSchema } from '../branding';

import { SAMPLE_TENANTS, getSampleInitialRole } from './sample-tenancy';

describe('getSampleInitialRole', () => {
  it.each(['/client', '/client/program', '/client/template'])('%s entra como cliente', (path) => {
    expect(getSampleInitialRole(path)).toBe('client');
  });

  it.each(['/', '/coach', '/coach/clients', '/welcome', '/clients'])(
    '%s entra como dueño (coach)',
    (path) => {
      expect(getSampleInitialRole(path)).toBe('owner');
    },
  );
});

describe('SAMPLE_TENANTS', () => {
  it('sus marcas cumplen el esquema de marca', () => {
    for (const tenant of SAMPLE_TENANTS) {
      expect(brandSchema.safeParse(tenant.branding).success).toBe(true);
    }
  });

  it('tienen identificadores distintos', () => {
    const ids = SAMPLE_TENANTS.map((tenant) => tenant.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
