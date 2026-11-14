import { describe, expect, it } from 'vitest';

import { BRAND_PALETTE, normalizeHexColor } from './brand-palette';
import { brandSchema } from './brand-schema';
import { DEFAULT_BRAND } from './default-brand';

describe('la paleta de la marca (D-057)', () => {
  it('tiene 12 colores distintos, todos válidos para la marca', () => {
    expect(BRAND_PALETTE).toHaveLength(12);
    expect(new Set(BRAND_PALETTE.map((color) => color.hex)).size).toBe(12);
    for (const { hex } of BRAND_PALETTE) {
      const brand = { ...DEFAULT_BRAND, colors: { primary: hex, accent: hex } };
      expect(brandSchema.safeParse(brand).success).toBe(true);
    }
  });

  it('incluye los colores de ATHLETE CORE, para poder volver a ellos', () => {
    const hexes = BRAND_PALETTE.map((color) => color.hex);
    expect(hexes).toContain(DEFAULT_BRAND.colors.primary);
    expect(hexes).toContain(DEFAULT_BRAND.colors.accent);
  });
});

describe('normalizeHexColor', () => {
  it('acepta un color con o sin # y lo deja en mayúsculas', () => {
    expect(normalizeHexColor('#1e5bd8')).toBe('#1E5BD8');
    expect(normalizeHexColor('  1E5BD8 ')).toBe('#1E5BD8');
  });

  it('lo que no es un color de 6 cifras no vale', () => {
    expect(normalizeHexColor('red')).toBeNull();
    expect(normalizeHexColor('#12345')).toBeNull();
    expect(normalizeHexColor('#1234567')).toBeNull();
    expect(normalizeHexColor('#GGGGGG')).toBeNull();
    expect(normalizeHexColor('')).toBeNull();
  });
});
