// Hook "pre-push" (lo llama .husky/pre-push). Hace dos cosas:
//
//  1. Impide subir la rama `main` desde el ordenador. Es el seguro local mientras
//     la protección de ramas de GitHub no esté activa (docs/GUIA-GIT.md §12).
//     Las etiquetas de versión (refs/tags/…) sí se pueden subir.
//  2. Ejecuta `npm run check`: lo mismo que exigirá el CI.
//
// Está escrito en Node (sin bash) para que funcione igual en Windows, macOS y Linux.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PROTECTED_REF = 'refs/heads/main';

// Git escribe por la entrada estándar una línea por cada referencia que se va a
// subir: "<ref local> <sha local> <ref remota> <sha remoto>".
function readPushedRefs() {
  try {
    return readFileSync(0, 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => line.split(' ')[2]);
  } catch {
    // Sin entrada estándar (nada que subir): no hay referencias que comprobar.
    return [];
  }
}

if (readPushedRefs().includes(PROTECTED_REF)) {
  console.error('');
  console.error('✖ No se sube directamente a "main".');
  console.error('  Trabaja en una rama y abre un Pull Request (docs/GUIA-GIT.md §3).');
  console.error('');
  process.exit(1);
}

const check = spawnSync('npm', ['run', 'check'], { stdio: 'inherit', shell: true });
process.exit(check.status ?? 1);
