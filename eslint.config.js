import { resolve } from 'node:path';

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ---------------------------------------------------------------------------
// Fronteras de ARQUITECTURA §6. Si cambias algo aquí, tiene que cambiar también
// ese documento (lo aprueba el propietario).
// ---------------------------------------------------------------------------

const APP_TYPES = ['app', 'app-coach', 'app-client', 'app-public'];

// Dependencias permitidas entre módulos (ARQUITECTURA §6, DECISIONES D-018).
// Siempre en una dirección y solo a través del index.ts del otro módulo.
const MODULE_DEPENDENCIES = {
  programs: ['exercises'],
  workouts: ['programs', 'exercises'],
  progress: ['workouts', 'exercises'],
};

// Dentro de un módulo: qué carpeta puede importar de cuál. `coach` y `client`
// no se ven entre sí (lo común va en `shared`), y `model` no depende de nadie.
const MODULE_PART_DEPENDENCIES = {
  coach: ['api', 'model', 'shared'],
  client: ['api', 'model', 'shared'],
  shared: ['api', 'model'],
  api: ['model'],
};

const sameModule = '{{ from.element.captured.module }}';

const boundaryPolicies = [
  // 1. core/ solo importa de core/.
  { from: { element: { type: 'core' } }, allow: { to: { element: { type: 'core' } } } },

  // 2. Un módulo importa de core/...
  {
    from: { element: { types: ['module', 'module-part'] } },
    allow: { to: { element: { type: 'core' } } },
  },
  // ...y sus archivos raíz (manifest.ts, index.ts) de sus propias carpetas.
  {
    from: { element: { type: 'module' } },
    allow: { to: { element: { type: 'module-part', captured: { module: sameModule } } } },
  },
  // Carpetas de un mismo módulo entre sí.
  ...Object.entries(MODULE_PART_DEPENDENCIES).map(([part, allowedParts]) => ({
    from: { element: { type: 'module-part', captured: { part } } },
    allow: {
      to: {
        element: {
          type: 'module-part',
          captured: allowedParts.map((allowedPart) => ({ module: sameModule, part: allowedPart })),
        },
      },
    },
  })),
  // De otro módulo, solo su index.ts y solo si está en la tabla.
  ...Object.entries(MODULE_DEPENDENCIES).map(([module, allowedModules]) => ({
    from: { element: { types: ['module', 'module-part'], captured: { module } } },
    allow: {
      to: {
        element: {
          type: 'module',
          captured: allowedModules.map((allowedModule) => ({ module: allowedModule })),
          fileInternalPath: 'index.ts',
        },
      },
    },
  })),

  // 3. El registro (modules/index.ts) junta los index.ts de cada módulo.
  {
    from: { element: { type: 'modules-registry' } },
    allow: {
      to: [
        { element: { type: 'core' } },
        { element: { type: 'module', fileInternalPath: 'index.ts' } },
      ],
    },
  },

  // 4. app/ importa de core/ y del registro de módulos, nunca de un módulo suelto.
  {
    from: { element: { types: APP_TYPES } },
    allow: {
      to: [
        { element: { type: 'core' } },
        { element: { type: 'modules-registry', fileInternalPath: 'index.ts' } },
        // Las piezas comunes de las carcasas viven en la raíz de app/.
        { element: { type: 'app' } },
      ],
    },
  },
  // Solo la raíz de app/ (router) monta las carcasas. Entre ellas no se importan:
  // la de coach no ve la de cliente, ni al revés.
  {
    from: { element: { type: 'app' } },
    allow: { to: { element: { types: ['app-coach', 'app-client', 'app-public'] } } },
  },

  // 5. El punto de arranque (src/main.tsx) lo conecta todo.
  {
    from: { element: { type: 'src-root' } },
    allow: {
      to: [
        { element: { types: ['core', 'app'] } },
        { element: { type: 'modules-registry', fileInternalPath: 'index.ts' } },
      ],
    },
  },

  // 6. Utilidades de test: las usa cualquier test, y ellas montan la app entera.
  {
    from: { file: { categories: 'test' } },
    allow: { to: { element: { type: 'test-utils' } } },
  },
  {
    from: { element: { type: 'test-utils' } },
    allow: {
      to: [
        { element: { types: ['core', ...APP_TYPES] } },
        { element: { type: 'modules-registry', fileInternalPath: 'index.ts' } },
      ],
    },
  },

  // 7. El cliente de Supabase (core/supabase) solo se importa desde carpetas
  //    api/. Estas dos políticas van al final a propósito: gana la última que
  //    coincide, así que mandan sobre todas las anteriores. Se comprueba el
  //    archivo de destino, no el texto del import: da igual que se escriba
  //    '@/core/supabase' o '../supabase'.
  {
    disallow: { to: { element: { type: 'core', captured: { area: 'supabase' } } } },
    message:
      'El cliente de Supabase solo se importa desde una carpeta api/ (ARQUITECTURA §6). Los componentes usan los hooks de api/.',
  },
  {
    from: { file: { categories: 'api' } },
    allow: { to: { element: { type: 'core', captured: { area: 'supabase' } } } },
  },
];

// ---------------------------------------------------------------------------
// Paquetes que solo se pueden importar desde una zona concreta.
// ---------------------------------------------------------------------------

const SUPABASE_RESTRICTION = {
  paths: [
    {
      name: '@supabase/supabase-js',
      message:
        'Solo core/supabase y las carpetas api/ hablan con Supabase (ARQUITECTURA §6). Usa un hook de api/.',
    },
  ],
  // Importar `core/supabase` (nuestro cliente) lo vigila la política 7 de las
  // fronteras, que es más fiable que un patrón sobre el texto del import.
  patterns: [],
};

const CAPACITOR_RESTRICTION = {
  paths: [],
  patterns: [
    {
      group: ['@capacitor/*'],
      message: 'Las funciones nativas se usan solo a través de core/native (ARQUITECTURA §12).',
    },
  ],
};

const PURE_MODEL_RESTRICTION = {
  paths: [
    { name: 'react', message: 'model/ es lógica pura: no importa React (ARQUITECTURA §6).' },
    { name: 'react-dom', message: 'model/ es lógica pura: no importa React (ARQUITECTURA §6).' },
  ],
  patterns: [
    {
      group: ['react/*', 'react-dom/*', 'react-router', '@tanstack/react-query'],
      message: 'model/ es lógica pura: sin React ni librerías de React (ARQUITECTURA §6).',
    },
  ],
};

// ESLint no fusiona las opciones de una misma regla entre bloques: el último
// bloque que aplica a un archivo gana. Por eso cada zona declara su lista completa.
function restrictedImports(...restrictions) {
  return [
    'error',
    {
      paths: restrictions.flatMap((restriction) => restriction.paths),
      patterns: restrictions.flatMap((restriction) => restriction.patterns),
    },
  ];
}

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'supabase',
    'android',
    'ios',
  ]),

  // Scripts y archivos de configuración en JavaScript (Node).
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  // Todo el TypeScript del repositorio.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // AGENTS.md §4: prohibido `any`, `export default` y `console.log`.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Usa exportaciones con nombre (AGENTS.md §4). `export default` está prohibido.',
        },
      ],
    },
  },

  // Código de la app: React y fronteras de arquitectura.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    plugins: { boundaries },
    languageOptions: { globals: globals.browser },
    settings: {
      'boundaries/root-path': resolve(import.meta.dirname),
      'boundaries/legacy-templates': false,
      // De más concreto a más general: gana el primero que coincide.
      'boundaries/elements': [
        { type: 'app-coach', pattern: 'src/app/coach', partialMatch: false },
        { type: 'app-client', pattern: 'src/app/client', partialMatch: false },
        { type: 'app-public', pattern: 'src/app/public', partialMatch: false },
        { type: 'app', pattern: 'src/app', partialMatch: false },
        { type: 'core', pattern: 'src/core/*', capture: ['area'], partialMatch: false },
        {
          type: 'module-part',
          pattern: 'src/modules/*/(api|model|coach|client|shared|i18n)',
          capture: ['module', 'part'],
          partialMatch: false,
        },
        { type: 'module', pattern: 'src/modules/*', capture: ['module'], partialMatch: false },
        { type: 'modules-registry', pattern: 'src/modules', partialMatch: false },
        { type: 'test-utils', pattern: 'src/test', partialMatch: false },
        { type: 'src-root', pattern: 'src', partialMatch: false },
      ],
      'boundaries/files': [
        { pattern: 'src/**/*.test.{ts,tsx}', category: 'test' },
        { pattern: 'src/**/api/**', category: 'api' },
      ],
      'import/resolver': {
        [resolve(import.meta.dirname, 'scripts/eslint-alias-resolver.cjs')]: {},
        node: {},
      },
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Import prohibido por las fronteras de ARQUITECTURA §6: "{{ from.element.path }}" no puede importar de "{{ to.element.path }}".',
          policies: boundaryPolicies,
        },
      ],
      'no-restricted-imports': restrictedImports(SUPABASE_RESTRICTION, CAPACITOR_RESTRICTION),
    },
  },

  // model/: lógica pura, sin React ni Supabase.
  {
    files: ['src/modules/*/model/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedImports(
        SUPABASE_RESTRICTION,
        CAPACITOR_RESTRICTION,
        PURE_MODEL_RESTRICTION,
      ),
    },
  },

  // Los únicos sitios que pueden importar el cliente de Supabase: donde se define
  // (core/supabase) y las carpetas api/.
  {
    files: ['src/core/supabase/**/*.{ts,tsx}', 'src/**/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedImports(CAPACITOR_RESTRICTION),
    },
  },

  // El único sitio que puede importar Capacitor.
  {
    files: ['src/core/native/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedImports(SUPABASE_RESTRICTION),
    },
  },

  // El logger es el único archivo que escribe en la consola.
  {
    files: ['src/core/lib/logger.ts'],
    rules: { 'no-console': 'off' },
  },

  // Archivos donde la herramienta exige `export default`.
  {
    files: ['*.config.{js,ts}'],
    rules: { 'no-restricted-syntax': 'off' },
  },

  // Prettier decide el formato: se apagan las reglas de estilo que chocarían.
  prettier,
]);
