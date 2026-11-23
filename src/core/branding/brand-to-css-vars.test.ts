import { describe, expect, it } from 'vitest';

import type { Brand } from './brand-schema';
import { BRAND_CSS_VARIABLES, applyBrandToElement, brandToCssVars } from './brand-to-css-vars';
import { MIN_TEXT_CONTRAST, contrastRatio } from './contrast';
import { DEFAULT_BRAND } from './default-brand';

const DARK_BRAND: Brand = {
  appName: 'Example Strength',
  logoPath: null,
  colors: { primary: '#1E3A8A', accent: '#F26A2E' },
  mode: 'dark',
};

const LIGHT_BRAND: Brand = {
  appName: 'Example Studio',
  logoPath: null,
  colors: { primary: '#FDE047', accent: '#0F766E' },
  mode: 'light',
};

describe('brandToCssVars', () => {
  it('devuelve todas las variables de tema', () => {
    const vars = brandToCssVars(DEFAULT_BRAND);
    expect(Object.keys(vars).sort()).toEqual([...BRAND_CSS_VARIABLES].sort());
  });

  it('usa los colores del coach como color principal y de acento', () => {
    const vars = brandToCssVars(DARK_BRAND);
    expect(vars['--brand-primary']).toBe('#1e3a8a');
    expect(vars['--brand-accent']).toBe('#f26a2e');
  });

  it('cambia los fondos según el modo', () => {
    const dark = brandToCssVars(DARK_BRAND);
    const light = brandToCssVars(LIGHT_BRAND);
    expect(dark['--brand-background']).not.toBe(light['--brand-background']);
    expect(contrastRatio(dark['--brand-foreground'], dark['--brand-background'])).toBeGreaterThan(
      MIN_TEXT_CONTRAST,
    );
    expect(contrastRatio(light['--brand-foreground'], light['--brand-background'])).toBeGreaterThan(
      MIN_TEXT_CONTRAST,
    );
  });

  it.each([
    ['oscura', DARK_BRAND],
    ['clara', LIGHT_BRAND],
    ['por defecto', DEFAULT_BRAND],
  ])('el texto sobre los colores de la marca %s se lee', (_name, brand) => {
    const vars = brandToCssVars(brand);
    expect(
      contrastRatio(vars['--brand-on-primary'], vars['--brand-primary']),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(contrastRatio(vars['--brand-on-accent'], vars['--brand-accent'])).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });

  it.each([
    ['oscura', DARK_BRAND],
    ['clara', LIGHT_BRAND],
  ])('corrige el color principal de la marca %s cuando no se leería como texto', (_name, brand) => {
    const vars = brandToCssVars(brand);
    // El color elegido no llega al contraste mínimo sobre el fondo...
    expect(contrastRatio(vars['--brand-primary'], vars['--brand-background'])).toBeLessThan(
      MIN_TEXT_CONTRAST,
    );
    // ...pero la variante para texto sí, sobre los dos fondos.
    expect(
      contrastRatio(vars['--brand-primary-readable'], vars['--brand-background']),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(
      contrastRatio(vars['--brand-primary-readable'], vars['--brand-surface']),
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});

describe('applyBrandToElement', () => {
  it('escribe las variables y el modo en el elemento', () => {
    const element = document.createElement('div');

    applyBrandToElement(LIGHT_BRAND, element);

    expect(element.style.getPropertyValue('--brand-primary')).toBe('#fde047');
    expect(element.style.getPropertyValue('--brand-background')).toBe('#e9eaee');
    expect(element.style.colorScheme).toBe('light');
    expect(element.dataset.mode).toBe('light');
  });

  it('sustituye la marca anterior al cambiar de coach', () => {
    const element = document.createElement('div');

    applyBrandToElement(LIGHT_BRAND, element);
    applyBrandToElement(DARK_BRAND, element);

    expect(element.style.getPropertyValue('--brand-primary')).toBe('#1e3a8a');
    expect(element.style.colorScheme).toBe('dark');
  });
});
