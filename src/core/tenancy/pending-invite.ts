import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { parseBrand } from '../branding/parse-brand';
import type { Brand } from '../branding/brand-schema';
import { parseInviteCodeParam } from './invite-code';

// El código de un coach que se recuerda en el dispositivo mientras se crea y se
// confirma la cuenta (DECISIONES D-037): 7 días como máximo. Con él se pintan
// las pantallas de cuenta con la marca del coach y, al terminar, el alta se hace
// sola. Solo guarda datos públicos: el código, el nombre y la marca del coach.

export interface PendingInvite {
  code: string;
  name: string;
  branding: Brand;
}

const STORAGE_KEY = 'athlete-core.pendingInvite';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const storedSchema = z.object({
  code: z.string(),
  name: z.string().max(120),
  branding: z.unknown(),
  at: z.number(),
});

const listeners = new Set<() => void>();
let cached: { raw: string | null; value: PendingInvite | null } = { raw: null, value: null };

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null, now: number): PendingInvite | null {
  if (raw === null) {
    return null;
  }
  try {
    const stored = storedSchema.safeParse(JSON.parse(raw));
    if (!stored.success || now - stored.data.at > MAX_AGE_MS) {
      return null;
    }
    const code = parseInviteCodeParam(stored.data.code);
    return code === ''
      ? null
      : { code, name: stored.data.name, branding: parseBrand(stored.data.branding) };
  } catch {
    return null;
  }
}

/** El código recordado, o `null` si no hay o ha caducado. */
export function readPendingInvite(now: number = Date.now()): PendingInvite | null {
  const raw = readRaw();
  // La misma respuesta mientras no cambie lo guardado: useSyncExternalStore lo exige.
  if (raw !== cached.raw) {
    cached = { raw, value: parse(raw, now) };
  }
  return cached.value;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function rememberPendingInvite(invite: PendingInvite, now: number = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...invite, at: now }));
  } catch {
    // Sin almacenamiento, el código no se recuerda: habrá que volver a escribirlo.
  }
  notify();
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Igual que arriba.
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** El código recordado, y la pantalla se actualiza cuando cambia. */
export function usePendingInvite(): PendingInvite | null {
  return useSyncExternalStore(
    subscribe,
    () => readPendingInvite(),
    () => null,
  );
}
