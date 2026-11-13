import { describe, expect, it } from 'vitest';

import { i18n, loadModuleTranslations, SUPPORTED_LANGUAGES } from '@/core/i18n';
import { describeTranslations } from '@/test/translation-shape';

import { registeredModules } from './index';

// Comprueba que TODOS los módulos (los de hoy y los que se creen) cumplen la
// forma fija de ARQUITECTURA §5. No hay que tocar este test al añadir un módulo.

const REQUIRED_FILES = ['manifest.ts', 'index.ts', 'README.md', 'i18n/en.json', 'i18n/es.json'];
const ALLOWED_FOLDERS = ['api', 'model', 'coach', 'client', 'shared', 'i18n'];

// Rutas de todos los archivos de todos los módulos, sin cargarlos.
const filePaths = Object.keys(import.meta.glob(['./*/**/*', './*/*']));
const translationFiles = import.meta.glob<{ default: unknown }>('./*/i18n/*.json', {
  eager: true,
});

function moduleFolder(filePath: string): string {
  return filePath.split('/')[1] ?? '';
}

const moduleFolders = [...new Set(filePaths.map(moduleFolder))].sort();

describe('forma fija de los módulos', () => {
  it('encuentra los módulos del proyecto', () => {
    expect(moduleFolders).toContain('_template');
  });

  describe.each(moduleFolders)('módulo %s', (folder) => {
    const ownPaths = filePaths
      .filter((filePath) => moduleFolder(filePath) === folder)
      .map((filePath) => filePath.slice(`./${folder}/`.length));

    it.each(REQUIRED_FILES)('tiene %s', (requiredFile) => {
      expect(ownPaths).toContain(requiredFile);
    });

    it('solo tiene las carpetas previstas', () => {
      const folders = ownPaths
        .filter((ownPath) => ownPath.includes('/'))
        .map((ownPath) => ownPath.split('/')[0]);
      const unexpected = [...new Set(folders)].filter(
        (name) => name === undefined || !ALLOWED_FOLDERS.includes(name),
      );
      expect(unexpected).toEqual([]);
    });

    it('sus textos en inglés y en español tienen las mismas claves y huecos', () => {
      const en = translationFiles[`./${folder}/i18n/en.json`]?.default;
      const es = translationFiles[`./${folder}/i18n/es.json`]?.default;
      expect(describeTranslations(es)).toEqual(describeTranslations(en));
    });
  });
});

describe('módulos registrados', () => {
  it('no hay dos módulos con la misma clave', () => {
    const keys = registeredModules.map((module) => module.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('los textos de su menú existen en todos los idiomas y llevan su prefijo', async () => {
    await loadModuleTranslations(registeredModules);

    for (const module of registeredModules) {
      for (const item of [...module.nav.coach, ...module.nav.client]) {
        expect(item.labelKey.startsWith(`${module.key}.`), item.labelKey).toBe(true);
        for (const language of SUPPORTED_LANGUAGES) {
          expect(i18n.exists(item.labelKey, { lng: language }), item.labelKey).toBe(true);
        }
      }
    }
  });

  it('no hay dos entradas de menú que apunten a la misma ruta', () => {
    for (const profile of ['coach', 'client'] as const) {
      const links = registeredModules.flatMap((module) =>
        module.nav[profile].map((item) => item.to),
      );
      expect(new Set(links).size, profile).toBe(links.length);
    }
  });
});
