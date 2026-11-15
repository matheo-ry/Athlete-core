import { z } from 'zod';

import { DEVICE_DRAFT_PREFIX } from '@/core/lib';

import { programDocumentSchema } from './program-document';
import type { ProgramDocument } from './program-document';

// Los cambios sin guardar de una rutina, en el dispositivo (PR 2.8b, D-079 y
// D-099). Si la app se cierra con cambios, al volver a abrir esa rutina se
// ofrece recuperarlos. Uno por usuario y rutina; se borran todos al cerrar
// sesión (core/lib/device-drafts). Lo leído se valida con Zod (AGENTS.md §4).

const storedSchema = z.object({
  userId: z.string(),
  programId: z.string(),
  document: programDocumentSchema,
});

function keyFor(userId: string, programId: string): string {
  return `${DEVICE_DRAFT_PREFIX}program.${userId}.${programId}`;
}

/**
 * El borrador de esa rutina, si lo hay y parte de la versión guardada que hay
 * ahora (`updatedAt`). Si la rutina se guardó después desde otro sitio, el
 * borrador ya no sirve y se olvida.
 */
export function readProgramDraft(
  userId: string,
  saved: ProgramDocument,
  storage: Storage = localStorage,
): ProgramDocument | null {
  if (saved.id === null) {
    return null;
  }
  try {
    const raw = storage.getItem(keyFor(userId, saved.id));
    if (raw === null) {
      return null;
    }
    const stored = storedSchema.safeParse(JSON.parse(raw));
    const usable =
      stored.success &&
      stored.data.userId === userId &&
      stored.data.programId === saved.id &&
      stored.data.document.updatedAt === saved.updatedAt;
    if (!usable) {
      storage.removeItem(keyFor(userId, saved.id));
      return null;
    }
    return stored.data.document;
  } catch {
    // Estropeado o el navegador no deja leer: como si no hubiera.
    return null;
  }
}

export function writeProgramDraft(
  userId: string,
  document: ProgramDocument,
  storage: Storage = localStorage,
): void {
  if (document.id === null) {
    return;
  }
  try {
    storage.setItem(
      keyFor(userId, document.id),
      JSON.stringify({ userId, programId: document.id, document }),
    );
  } catch {
    // Sin espacio o en modo privado estricto: no se puede recuperar, nada más.
  }
}

export function clearProgramDraft(
  userId: string,
  programId: string,
  storage: Storage = localStorage,
): void {
  try {
    storage.removeItem(keyFor(userId, programId));
  } catch {
    // Nada que borrar.
  }
}
