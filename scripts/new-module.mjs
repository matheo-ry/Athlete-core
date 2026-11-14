// Crea un módulo nuevo copiando src/modules/_template (ARQUITECTURA §15).
//
//   npm run new:module <nombre>
//
// Está escrito en Node (sin bash) para que funcione igual en Windows, macOS y Linux.

import { existsSync } from 'node:fs';
import { cp, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Una sola palabra en minúsculas, como los módulos previstos (clients, programs,
// workouts…). Así el nombre sirve tal cual de carpeta, de clave del módulo, de
// feature flag y de prefijo de los textos.
const NAME_PATTERN = /^[a-z][a-z0-9]*$/;

const modulesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'modules',
);
const templateDir = path.join(modulesDir, '_template');

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const name = process.argv[2];

if (!name) {
  fail('Falta el nombre. Uso: npm run new:module <nombre>');
}
if (!NAME_PATTERN.test(name)) {
  fail(`"${name}" no vale: usa una sola palabra en minúsculas, sin guiones (ej. "programs").`);
}
if (name === 'template') {
  fail('"template" está reservado para el módulo de ejemplo.');
}

const targetDir = path.join(modulesDir, name);
if (existsSync(targetDir)) {
  fail(`Ya existe src/modules/${name}.`);
}

const pascalName = name.charAt(0).toUpperCase() + name.slice(1);

function replaceTokens(text) {
  return text
    .replaceAll('_template', name)
    .replaceAll('Template', pascalName)
    .replaceAll('template', name);
}

async function renameTokens(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const currentPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await renameTokens(currentPath);
      continue;
    }
    await writeFile(currentPath, replaceTokens(await readFile(currentPath, 'utf8')));
    const newName = replaceTokens(entry.name);
    if (newName !== entry.name) {
      await rename(currentPath, path.join(directory, newName));
    }
  }
}

const readme = `# Módulo \`${name}\`

- **Qué hace:** (por rellenar)
- **Tablas que usa:** (por rellenar)
- **Estado:** recién creado a partir de \`_template\`. \`api/\` todavía devuelve datos falsos.
`;

await cp(templateDir, targetDir, { recursive: true });
await renameTokens(targetDir);
await writeFile(path.join(targetDir, 'README.md'), readme);

console.log(`✔ Creado src/modules/${name}

Ahora te toca a ti (ARQUITECTURA §15):
  1. Añádelo al registro: importa "${name}Module" en src/modules/index.ts y ponlo en "productModules".
  2. Activa su flag "${name}" con una migración que lo inserte en la tabla "features",
     y añádelo a la lista de supabase/tests/04_rls_enabled.test.sql.
  3. Rellena src/modules/${name}/README.md y revisa manifest.ts (rutas, menú, icono).
  4. Si usa a otro módulo, añade la dependencia a ARQUITECTURA §6 y a docs/DECISIONES.md.
  5. Si necesita tablas, crea la migración con la plantilla y su test de aislamiento.
`);
