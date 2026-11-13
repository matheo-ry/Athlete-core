import { describe, expect, it } from 'vitest';

import { toLanguage } from './languages';

describe('toLanguage', () => {
  it('acepta los idiomas de la app', () => {
    expect(toLanguage('en')).toBe('en');
    expect(toLanguage('es')).toBe('es');
  });

  it('ignora la región y las mayúsculas', () => {
    expect(toLanguage('es-ES')).toBe('es');
    expect(toLanguage('EN-gb')).toBe('en');
  });

  it('usa inglés para idiomas que la app no tiene o si no hay valor', () => {
    expect(toLanguage('fr-FR')).toBe('en');
    expect(toLanguage(undefined)).toBe('en');
  });
});
