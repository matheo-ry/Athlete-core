import { describe, expect, it } from 'vitest';

import { brandInitials } from './brand-initials';

describe('brandInitials', () => {
  it('toma la primera letra de las dos primeras palabras', () => {
    expect(brandInitials('Norte Strength')).toBe('NS');
    expect(brandInitials('iron lab club')).toBe('IL');
  });

  it('con una sola palabra, una letra', () => {
    expect(brandInitials('Fuerza')).toBe('F');
  });

  it('sin nombre no se queda vacío', () => {
    expect(brandInitials('   ')).toBe('?');
  });
});
