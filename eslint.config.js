import { resolve } from 'node:path';

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
  BOUNDARY_MESSAGE,
  boundaryElements,
  boundaryFiles,
  boundaryPolicies,
} from './eslint.boundaries.js';

// Las fronteras entre carpetas (quién puede importar a quién) están en
// eslint.boundaries.js. Aquí están el resto de reglas y los paquetes que solo
// puede usar una zona.

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
    // Generado por Supabase (`npm run db:types`): no se edita a mano, así que el
    // lint no puede pedir cambios en él (DECISIONES D-034). TypeScript sí lo comprueba.
    'src/core/supabase/database.types.ts',
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
      'boundaries/elements': boundaryElements,
      'boundaries/files': boundaryFiles,
      'import/resolver': {
        [resolve(import.meta.dirname, 'scripts/eslint-alias-resolver.cjs')]: {},
        node: {},
      },
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', message: BOUNDARY_MESSAGE, policies: boundaryPolicies },
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

  // Los únicos sitios que pueden importar el paquete de Supabase: donde se
  // define el cliente (core/supabase) y las carpetas api/.
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
