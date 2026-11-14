// La sesión se cierra si pasan 30 días sin abrir la app (DECISIONES D-045).
// Lo comprueba la propia app porque el cierre por inactividad de Supabase es de
// pago (D-063). Es comodidad, no seguridad: la sesión sigue valiendo en el servidor.

export const INACTIVITY_LIMIT_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'athlete-core.lastActiveAt';

/** ¿Ha pasado demasiado tiempo desde la última vez que se abrió la app? */
export function isInactiveTooLong(
  lastActiveAt: number | null,
  now: number,
  limitDays: number = INACTIVITY_LIMIT_DAYS,
): boolean {
  if (lastActiveAt === null) {
    return false;
  }
  return now - lastActiveAt > limitDays * DAY_MS;
}

// El almacenamiento del navegador puede fallar (modo privado, sin permiso): en ese
// caso no se recuerda nada y la sesión no caduca por inactividad.

export function readLastActiveAt(storage: Storage = localStorage): number | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeLastActiveAt(now: number, storage: Storage = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, String(now));
  } catch {
    // Sin almacenamiento no hay nada que recordar (ver arriba).
  }
}

export function clearLastActiveAt(storage: Storage = localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Igual que arriba.
  }
}
