import { useSyncExternalStore } from 'react';
import { z } from 'zod';

// El último espacio en el que entró cada usuario en este dispositivo (D-056 y
// D-066). Con varios espacios, se vuelve a entrar en él directamente; si no hay
// ninguno recordado, se ve el selector. Se olvida al cerrar sesión. Solo guarda
// dos identificadores: el del usuario y el del negocio.

const STORAGE_KEY = 'athlete-core.lastSpace';

const storedSchema = z.object({ userId: z.string(), tenantId: z.string() });

// Si el navegador no deja guardar (modo privado estricto), se recuerda solo
// mientras la app está abierta.
let fallbackRaw: string | null = null;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return fallbackRaw;
  }
}

function writeRaw(raw: string | null): void {
  fallbackRaw = raw;
  try {
    if (raw === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, raw);
    }
  } catch {
    // Queda en `fallbackRaw`.
  }
  for (const listener of listeners) {
    listener();
  }
}

/** El negocio recordado para ese usuario, o `null`. */
export function readLastSpace(userId: string): string | null {
  const raw = readRaw();
  if (raw === null) {
    return null;
  }
  try {
    const stored = storedSchema.safeParse(JSON.parse(raw));
    return stored.success && stored.data.userId === userId ? stored.data.tenantId : null;
  } catch {
    return null;
  }
}

export function rememberLastSpace(userId: string, tenantId: string): void {
  writeRaw(JSON.stringify({ userId, tenantId }));
}

export function clearLastSpace(): void {
  writeRaw(null);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** El negocio recordado para ese usuario, y la pantalla se actualiza cuando cambia. */
export function useLastSpace(userId: string | null): string | null {
  return useSyncExternalStore(
    subscribe,
    () => (userId === null ? null : readLastSpace(userId)),
    () => null,
  );
}
