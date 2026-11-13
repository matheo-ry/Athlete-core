// FRONTERAS DE ARQUITECTURA (ARQUITECTURA §6): quién puede importar a quién.
//
// Las aplica eslint.config.js con eslint-plugin-boundaries y las prueba
// scripts/eslint-boundaries.test.mjs. Si cambias algo aquí, tiene que cambiar
// también ese documento (lo aprueba el propietario).

// ---------------------------------------------------------------------------
// 1. Cómo se clasifica cada carpeta de src/.
//    De más concreto a más general: gana la primera que coincide.
// ---------------------------------------------------------------------------

export const boundaryElements = [
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
];

// Categorías de un archivo, además de la carpeta en la que está.
export const boundaryFiles = [
  { pattern: 'src/**/*.test.{ts,tsx}', category: 'test' },
  { pattern: 'src/**/api/**', category: 'api' },
];

export const BOUNDARY_MESSAGE =
  'Import prohibido por las fronteras de ARQUITECTURA §6: "{{ from.element.path }}" no puede importar de "{{ to.element.path }}".';

// ---------------------------------------------------------------------------
// 2. Las tablas que más cambian.
// ---------------------------------------------------------------------------

// Dependencias permitidas entre módulos (ARQUITECTURA §6, DECISIONES D-018).
// Siempre en una dirección y solo a través del index.ts del otro módulo.
// Añadir una fila aquí exige una entrada en docs/DECISIONES.md.
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

// ---------------------------------------------------------------------------
// 3. Las políticas. Por defecto todo import entre carpetas está prohibido; aquí
//    se permite lo que la arquitectura permite. Gana la ÚLTIMA que coincide.
// ---------------------------------------------------------------------------

const APP_TYPES = ['app', 'app-coach', 'app-client', 'app-public'];

const sameModule = '{{ from.element.captured.module }}';

export const boundaryPolicies = [
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
