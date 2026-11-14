import { describe, expect, it } from 'vitest';

import { defineModule } from '@/core/modules';
import type { ModuleManifest } from '@/core/modules';

import { filterActiveModules } from './active-modules';

function fakeModule(key: string): ModuleManifest {
  return defineModule({
    key,
    routes: {
      coach: [{ path: key, lazy: () => Promise.reject(new Error('not used')) }],
      client: [],
    },
    nav: {
      coach: [{ to: `/coach/${key}`, labelKey: `${key}.nav`, icon: 'home', order: 10 }],
      client: [],
    },
    i18n: {
      en: () => Promise.resolve({ default: {} }),
      es: () => Promise.resolve({ default: {} }),
    },
    clientProfileTabs: [],
  });
}

const flags = (...keys: string[]) => ({ isEnabled: (key: string) => keys.includes(key) });

describe('filterActiveModules', () => {
  const programs = fakeModule('programs');
  const exercises = fakeModule('exercises');
  const template = fakeModule('template');

  it('un módulo con el flag apagado no monta ni sus rutas ni su menú', () => {
    const active = filterActiveModules([programs, exercises], flags('programs'), new Set());
    expect(active.map((module) => module.key)).toEqual(['programs']);
  });

  it('sin ningún flag activo, no se monta ningún módulo del producto', () => {
    expect(filterActiveModules([programs, exercises], flags(), new Set())).toEqual([]);
  });

  it('los módulos de ejemplo se montan en desarrollo sin flag en la base de datos', () => {
    const active = filterActiveModules([programs, template], flags(), new Set(['template']));
    expect(active.map((module) => module.key)).toEqual(['template']);
  });
});
