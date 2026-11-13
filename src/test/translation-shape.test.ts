import { describe, expect, it } from 'vitest';

import { describeTranslations } from './translation-shape';

describe('describeTranslations', () => {
  it('aplana las claves con puntos', () => {
    expect(describeTranslations({ nav: { coach: 'Programs', client: 'My program' } })).toEqual({
      'nav.coach': [],
      'nav.client': [],
    });
  });

  it('recoge los huecos de cada texto, ordenados', () => {
    expect(describeTranslations({ summary: '{{sets}} × {{ reps }} at {{weight}}' })).toEqual({
      summary: ['reps', 'sets', 'weight'],
    });
  });

  it('detecta una clave que falta en un idioma', () => {
    const en = describeTranslations({ title: 'Title', save: 'Save' });
    const es = describeTranslations({ title: 'Título' });
    expect(es).not.toEqual(en);
  });

  it('detecta un hueco distinto entre idiomas', () => {
    const en = describeTranslations({ total: 'Total: {{volume}}' });
    const es = describeTranslations({ total: 'Total: {{volumen}}' });
    expect(es).not.toEqual(en);
  });

  it('rechaza valores que no son texto', () => {
    expect(() => describeTranslations({ count: 3 })).toThrow('must be a text or a group of texts');
  });
});
