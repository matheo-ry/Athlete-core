import { useSyncExternalStore } from 'react';
import { z } from 'zod';

// Dónde ya se le ha preguntado a este usuario por los datos de salud (D-126).
// Con "Ahora no" la ventana no sale sola otra vez en este dispositivo: se
// vuelve a pedir cuando intente apuntar peso, medidas o notas. Solo guarda
// identificadores (usuario y negocio), nada de salud, y no se borra al cerrar
// sesión: volver a entrar no debe repetir la pregunta.

const STORAGE_KEY = 'athlete-core.healthConsentAsked';

const storedSchema = z.array(z.string());

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

function writeRaw(raw: string): void {
  fallbackRaw = raw;
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Queda en `fallbackRaw`.
  }
  for (const listener of listeners) {
    listener();
  }
}

function readAll(): string[] {
  const raw = readRaw();
  if (raw === null) {
    return [];
  }
  try {
    const stored = storedSchema.safeParse(JSON.parse(raw));
    return stored.success ? stored.data : [];
  } catch {
    return [];
  }
}

function entry(userId: string, tenantId: string): string {
  return `${userId}/${tenantId}`;
}

/** ¿Se le ha preguntado ya a ese usuario en ese negocio, en este dispositivo? */
export function wasHealthConsentAsked(userId: string, tenantId: string): boolean {
  return readAll().includes(entry(userId, tenantId));
}

export function markHealthConsentAsked(userId: string, tenantId: string): void {
  const current = readAll();
  const key = entry(userId, tenantId);
  if (!current.includes(key)) {
    writeRaw(JSON.stringify([...current, key]));
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Lo mismo que `wasHealthConsentAsked`, y la pantalla se actualiza cuando cambia. */
export function useHealthConsentAsked(userId: string | null, tenantId: string | null): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (userId === null || tenantId === null ? false : wasHealthConsentAsked(userId, tenantId)),
    () => false,
  );
}
