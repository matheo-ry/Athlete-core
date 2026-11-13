// Genera los tipos de TypeScript de la base de datos local en
// src/core/supabase/database.types.ts (AGENTS.md §4: no se editan a mano).
//
// Uso:
//   npm run db:types           -> regenera el archivo
//   npm run db:types -- --check -> falla si el archivo no está al día (lo usa el CI)
//
// Se hace en Node y no con ">" en package.json para que funcione igual en
// Windows, macOS y Linux, y para darle formato con Prettier antes de comparar.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import prettier from 'prettier';

const TARGET = fileURLToPath(new URL('../src/core/supabase/database.types.ts', import.meta.url));
const HEADER =
  '// Archivo generado con `npm run db:types` a partir de supabase/migrations/.\n' +
  '// No se edita a mano: cambia la migración y vuelve a generarlo.\n\n';

const isCheck = process.argv.includes('--check');

// Una sola cadena (sin argumentos sueltos) para que "npx" se encuentre también
// en Windows sin el aviso de Node sobre shell + argumentos.
const generated = execSync('npx supabase gen types typescript --local', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});

const options = (await prettier.resolveConfig(TARGET)) ?? {};
const formatted = await prettier.format(HEADER + generated, { ...options, filepath: TARGET });

if (isCheck) {
  let current;
  try {
    current = readFileSync(TARGET, 'utf8');
  } catch {
    // Si el archivo no existe, no está al día.
    current = '';
  }
  if (current !== formatted) {
    console.error(
      'database.types.ts no está al día con las migraciones. Ejecuta "npm run db:types" y haz commit del resultado.',
    );
    process.exit(1);
  }
  console.log('database.types.ts está al día.');
} else {
  writeFileSync(TARGET, formatted);
  console.log(`Tipos generados en ${TARGET}`);
}
