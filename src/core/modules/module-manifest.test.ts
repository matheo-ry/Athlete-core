import { describe, expect, it } from 'vitest';

import { defineModule } from './module-manifest';
import type { ModuleManifest } from './module-manifest';
import { collectNavItems, collectRoutes } from './module-registry';

function ExamplePage() {
  return null;
}

const loadPage = () => Promise.resolve({ Component: ExamplePage });
const loadTexts = () => Promise.resolve({ default: {} });

function buildManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    key: 'example',
    routes: {
      coach: [{ path: 'example', lazy: loadPage }],
      client: [{ path: 'example', lazy: loadPage }],
    },
    nav: {
      coach: [{ to: '/coach/example', labelKey: 'example.nav.coach', icon: 'template', order: 20 }],
      client: [
        { to: '/client/example', labelKey: 'example.nav.client', icon: 'template', order: 20 },
      ],
    },
    i18n: { en: loadTexts, es: loadTexts },
    clientProfileTabs: [],
    ...overrides,
  };
}

describe('defineModule', () => {
  it('devuelve el manifest cuando es correcto', () => {
    const manifest = buildManifest();
    expect(defineModule(manifest)).toBe(manifest);
  });

  it.each(['Example', 'my-module', '1module', ''])('rechaza la clave "%s"', (key) => {
    expect(() => defineModule(buildManifest({ key }))).toThrow('must be snake_case');
  });

  it('rechaza una ruta que no es relativa a la zona del perfil', () => {
    const manifest = buildManifest({
      routes: { coach: [{ path: '/coach/example', lazy: loadPage }], client: [] },
    });
    expect(() => defineModule(manifest)).toThrow('must be relative to /coach');
  });

  it('rechaza una entrada de menú que apunta a la zona del otro perfil', () => {
    const manifest = buildManifest({
      nav: {
        coach: [],
        client: [
          { to: '/coach/example', labelKey: 'example.nav.client', icon: 'template', order: 1 },
        ],
      },
    });
    expect(() => defineModule(manifest)).toThrow('must start with /client/');
  });
});

describe('collectRoutes / collectNavItems', () => {
  const first = buildManifest({
    key: 'first',
    nav: {
      coach: [{ to: '/coach/first', labelKey: 'first.nav.coach', icon: 'users', order: 30 }],
      client: [],
    },
  });
  const second = buildManifest({
    key: 'second',
    routes: { coach: [{ path: 'second', lazy: loadPage }], client: [] },
    nav: {
      coach: [{ to: '/coach/second', labelKey: 'second.nav.coach', icon: 'chart', order: 10 }],
      client: [],
    },
  });

  it('junta las rutas de todos los módulos para un perfil', () => {
    expect(collectRoutes([first, second], 'coach').map((route) => route.path)).toEqual([
      'example',
      'second',
    ]);
    expect(collectRoutes([first, second], 'client').map((route) => route.path)).toEqual([
      'example',
    ]);
  });

  it('ordena las entradas de menú por su campo order', () => {
    expect(collectNavItems([first, second], 'coach').map((item) => item.to)).toEqual([
      '/coach/second',
      '/coach/first',
    ]);
  });

  it('devuelve listas vacías si ningún módulo aporta nada', () => {
    expect(collectNavItems([first, second], 'client')).toEqual([]);
    expect(collectRoutes([], 'coach')).toEqual([]);
  });
});
