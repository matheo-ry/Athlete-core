import { describe, expect, it } from 'vitest';

import { profileForRole } from './tenancy-types';

describe('profileForRole', () => {
  it('owner y staff ven el perfil de coach', () => {
    expect(profileForRole('owner')).toBe('coach');
    expect(profileForRole('staff')).toBe('coach');
  });

  it('client ve el perfil de cliente', () => {
    expect(profileForRole('client')).toBe('client');
  });
});
