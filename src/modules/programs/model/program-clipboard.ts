import { z } from 'zod';

import { DEVICE_DRAFT_PREFIX } from '@/core/lib';

import { programBlockSchema, programDayExerciseSchema, programDaySchema } from './program-document';

// Lo copiado en el editor, para pegarlo en otra rutina (PR 2.11, D-080): un
// ejercicio, un día o un bloque. Se guarda en el dispositivo, uno por usuario y negocio
// (los ejercicios son de cada negocio), y se olvida al cerrar sesión, como
// los borradores (core/lib/device-drafts). Lo leído se valida con Zod.

const clipboardSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('exercise'), item: programDayExerciseSchema }),
  z.object({ kind: z.literal('day'), day: programDaySchema }),
  // Un bloque entero (PR 2.16).
  z.object({ kind: z.literal('block'), block: programBlockSchema }),
]);

export type ProgramClipboard = z.infer<typeof clipboardSchema>;

function keyFor(userId: string, tenantId: string): string {
  return `${DEVICE_DRAFT_PREFIX}clipboard.${userId}.${tenantId}`;
}

export function readClipboard(
  userId: string,
  tenantId: string,
  storage: Storage = localStorage,
): ProgramClipboard | null {
  try {
    const raw = storage.getItem(keyFor(userId, tenantId));
    if (raw === null) {
      return null;
    }
    const parsed = clipboardSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    // Estropeado o el navegador no deja leer: como si no hubiera nada copiado.
    return null;
  }
}

export function writeClipboard(
  userId: string,
  tenantId: string,
  content: ProgramClipboard,
  storage: Storage = localStorage,
): void {
  try {
    storage.setItem(keyFor(userId, tenantId), JSON.stringify(content));
  } catch {
    // Sin espacio o en modo privado estricto: no se puede copiar, nada más.
  }
}
