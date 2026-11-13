import { describe, expect, it } from 'vitest';

import { describeTranslations } from '@/test/translation-shape';

import en from './locales/en.json';
import es from './locales/es.json';

// AGENTS.md, regla 7: todo texto visible existe en inglés y en español.
describe('textos comunes', () => {
  it('inglés y español tienen las mismas claves y los mismos huecos', () => {
    expect(describeTranslations(es)).toEqual(describeTranslations(en));
  });

  it('ningún texto está vacío', () => {
    for (const [language, texts] of Object.entries({ en, es })) {
      const empty = JSON.stringify(texts).includes('""');
      expect(empty, `hay un texto vacío en ${language}.json`).toBe(false);
    }
  });
});
