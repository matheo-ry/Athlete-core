// Test de las FRONTERAS DE ARQUITECTURA (ARQUITECTURA §6).
//
// Las fronteras las comprueba ESLint con las reglas de eslint.boundaries.js y
// eslint.config.js. Este test comprueba a las propias reglas: pasa por ESLint
// una serie de imports que deben estar prohibidos y otros que deben estar
// permitidos. Si alguien afloja la configuración (a propósito o sin querer),
// este test falla.
//
// Los archivos de ejemplo no existen en disco: se le da a ESLint el texto y la
// ruta que tendrían. Los imports sí apuntan a archivos reales del proyecto.
//
// Pendiente para cuando existan dos módulos reales (Fase 2): añadir el caso
// permitido de la tabla de dependencias (programs → index.ts de exercises).

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BOUNDARY = 'boundaries/dependencies';
const RESTRICTED_IMPORT = 'no-restricted-imports';

/** @type {ESLint} */
let eslint;

beforeAll(() => {
  eslint = new ESLint({
    cwd: rootDir,
    // Las reglas que necesitan los tipos de TypeScript solo funcionan con
    // archivos que existen en disco. Aquí se apagan: no son las que se prueban.
    overrideConfig: [tseslint.configs.disableTypeChecked],
  });
});

async function lintImport(filePath, importSource) {
  const code = `import { something } from '${importSource}';\nexport const fixture = something;\n`;
  return lintCode(filePath, code);
}

async function lintCode(filePath, code) {
  const [result] = await eslint.lintText(code, { filePath: path.join(rootDir, filePath) });
  return result.messages.map((message) => message.ruleId);
}

describe('imports prohibidos', () => {
  it.each([
    // coach/ y client/ no se importan entre sí.
    [
      'la carcasa de coach importa de la de cliente',
      'src/app/coach/zz.ts',
      '../client/ClientLayout',
    ],
    [
      'la carcasa de cliente importa de la de coach',
      'src/app/client/zz.ts',
      '../coach/CoachLayout',
    ],
    [
      'coach/ de un módulo importa de su client/',
      'src/modules/_template/coach/zz.ts',
      '../client/TemplateClientPage',
    ],
    [
      'client/ de un módulo importa de su coach/',
      'src/modules/_template/client/zz.ts',
      '../coach/TemplateCoachPage',
    ],
    [
      'coach/ importa de client/ usando el alias @/',
      'src/modules/_template/coach/zz.ts',
      '@/modules/_template/client/TemplateClientPage',
    ],

    // core/ no importa de modules/ ni de app/.
    ['core importa del registro de módulos', 'src/core/lib/zz.ts', '@/modules'],
    ['core importa de app', 'src/core/lib/zz.ts', '@/app/router'],

    // app/ solo conoce los módulos a través del registro.
    ['app importa un módulo concreto', 'src/app/zz.ts', '@/modules/_template'],
    [
      'app importa una carpeta interna de un módulo',
      'src/app/zz.ts',
      '@/modules/_template/api/useTemplateItems',
    ],

    // Un módulo nunca importa de app/, y model/ no depende de nadie.
    ['un módulo importa de app', 'src/modules/_template/shared/zz.ts', '@/app/BrandMark'],
    ['model/ importa de api/', 'src/modules/_template/model/zz.ts', '../api/useTemplateItems'],
    [
      'api/ importa de una pantalla',
      'src/modules/_template/api/zz.ts',
      '../coach/TemplateCoachPage',
    ],

    // De otro módulo, solo su index.ts y solo si está en la tabla de dependencias.
    [
      'un módulo importa de otro que no está en su tabla',
      'src/modules/programs/coach/zz.ts',
      '@/modules/_template',
    ],
    [
      'un módulo importa una carpeta interna de otro',
      'src/modules/programs/coach/zz.ts',
      '@/modules/_template/model/template-volume',
    ],

    // El cliente de Supabase solo se importa desde carpetas api/.
    ['una carcasa importa el cliente de Supabase', 'src/app/coach/zz.ts', '@/core/supabase'],
    [
      'una pantalla de un módulo importa el cliente de Supabase',
      'src/modules/_template/coach/zz.ts',
      '@/core/supabase',
    ],
    [
      'model/ importa el cliente de Supabase',
      'src/modules/_template/model/zz.ts',
      '@/core/supabase',
    ],
    ['core importa el cliente con una ruta relativa', 'src/core/auth/zz.ts', '../supabase'],
    [
      'core importa el archivo del cliente directamente',
      'src/core/auth/zz.ts',
      '../supabase/client',
    ],
  ])('%s', async (_name, filePath, importSource) => {
    expect(await lintImport(filePath, importSource)).toEqual([BOUNDARY]);
  });
});

describe('paquetes restringidos a una zona', () => {
  it.each([
    [
      'una pantalla importa @supabase/supabase-js',
      'src/modules/_template/coach/zz.ts',
      '@supabase/supabase-js',
    ],
    ['app importa @supabase/supabase-js', 'src/app/zz.ts', '@supabase/supabase-js'],
    [
      'core (fuera de supabase) importa @supabase/supabase-js',
      'src/core/auth/zz.ts',
      '@supabase/supabase-js',
    ],
    ['model/ importa react', 'src/modules/_template/model/zz.ts', 'react'],
    ['model/ importa react-router', 'src/modules/_template/model/zz.ts', 'react-router'],
    [
      'model/ importa @supabase/supabase-js',
      'src/modules/_template/model/zz.ts',
      '@supabase/supabase-js',
    ],
    ['app importa Capacitor', 'src/app/zz.ts', '@capacitor/core'],
    ['un módulo importa Capacitor', 'src/modules/_template/api/zz.ts', '@capacitor/core'],
  ])('%s', async (_name, filePath, importSource) => {
    expect(await lintImport(filePath, importSource)).toEqual([RESTRICTED_IMPORT]);
  });
});

describe('imports permitidos', () => {
  it.each([
    ['una carcasa importa de core', 'src/app/coach/zz.ts', '@/core/ui'],
    ['una carcasa importa las piezas comunes de app', 'src/app/coach/zz.ts', '../BrandMark'],
    ['app importa el registro de módulos', 'src/app/zz.ts', '@/modules'],
    ['el router monta las carcasas', 'src/app/zz.ts', './coach/CoachLayout'],
    ['core importa de core', 'src/core/branding/zz.ts', '../tenancy'],
    [
      'una pantalla importa de shared/',
      'src/modules/_template/coach/zz.ts',
      '../shared/TemplateItemList',
    ],
    [
      'una pantalla importa un hook de api/',
      'src/modules/_template/client/zz.ts',
      '../api/useTemplateItems',
    ],
    [
      'una pantalla importa de model/',
      'src/modules/_template/coach/zz.ts',
      '../model/template-volume',
    ],
    ['shared/ importa de api/', 'src/modules/_template/shared/zz.ts', '../api/useTemplateItems'],
    ['api/ importa de model/', 'src/modules/_template/api/zz.ts', '../model/template-item-schema'],
    ['un módulo importa de core', 'src/modules/_template/model/zz.ts', '@/core/lib'],
    [
      'el manifest importa sus pantallas',
      'src/modules/_template/zz.ts',
      './coach/TemplateCoachPage',
    ],
    ['el registro importa el index.ts de un módulo', 'src/modules/zz.ts', './_template'],
    [
      'api/ de un módulo importa el cliente de Supabase',
      'src/modules/_template/api/zz.ts',
      '@/core/supabase',
    ],
    [
      'una carpeta api/ de core importa el cliente de Supabase',
      'src/core/auth/api/zz.ts',
      '../../supabase',
    ],
    [
      'core/supabase importa @supabase/supabase-js',
      'src/core/supabase/zz.ts',
      '@supabase/supabase-js',
    ],
    ['core/native importa Capacitor', 'src/core/native/zz.ts', '@capacitor/core'],
    ['una pantalla importa react', 'src/modules/_template/coach/zz.tsx', 'react'],
    [
      'un test importa las utilidades de test',
      'src/modules/_template/coach/zz.test.tsx',
      '@/test/render-app',
    ],
  ])('%s', async (_name, filePath, importSource) => {
    expect(await lintImport(filePath, importSource)).toEqual([]);
  });
});

describe('normas de código (AGENTS.md §4)', () => {
  it('prohíbe any', async () => {
    const ruleIds = await lintCode('src/core/lib/zz.ts', 'export const value: any = 1;\n');
    expect(ruleIds).toEqual(['@typescript-eslint/no-explicit-any']);
  });

  it('prohíbe console.log', async () => {
    const ruleIds = await lintCode('src/core/ui/zz.ts', "console.log('hello');\n");
    expect(ruleIds).toEqual(['no-console']);
  });

  it('solo el logger puede escribir en la consola', async () => {
    const ruleIds = await lintCode('src/core/lib/logger.ts', "console.warn('hello');\n");
    expect(ruleIds).toEqual([]);
  });

  it('prohíbe export default', async () => {
    const ruleIds = await lintCode(
      'src/core/ui/zz.ts',
      'const value = 1;\nexport default value;\n',
    );
    expect(ruleIds).toEqual(['no-restricted-syntax']);
  });

  it('prohíbe @ts-ignore', async () => {
    const code = '// @ts-ignore\nexport const value: number = 1;\n';
    expect(await lintCode('src/core/lib/zz.ts', code)).toEqual([
      '@typescript-eslint/ban-ts-comment',
    ]);
  });
});
