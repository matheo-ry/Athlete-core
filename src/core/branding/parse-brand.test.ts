import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_BRAND } from './default-brand';
import { parseBrand } from './parse-brand';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseBrand', () => {
  it('acepta una marca con la forma de ARQUITECTURA §10', () => {
    const brand = parseBrand({
      appName: 'Example Strength',
      logoPath: 'tenant-id/logo.png',
      colors: { primary: '#1E5BD8', accent: '#F26A2E' },
      mode: 'dark',
    });

    expect(brand.appName).toBe('Example Strength');
    expect(brand.colors.primary).toBe('#1E5BD8');
  });

  it.each([
    ['un color que no es hex', { colors: { primary: 'blue', accent: '#F26A2E' } }],
    ['un modo desconocido', { mode: 'sepia' }],
    ['un nombre vacío', { appName: '   ' }],
  ])('vuelve a la marca por defecto con %s', (_name, override) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const brand = parseBrand({
      appName: 'Example Strength',
      logoPath: null,
      colors: { primary: '#1E5BD8', accent: '#F26A2E' },
      mode: 'dark',
      ...override,
    });

    expect(brand).toEqual(DEFAULT_BRAND);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('vuelve a la marca por defecto si no llega nada', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(parseBrand(null)).toEqual(DEFAULT_BRAND);
  });
});
