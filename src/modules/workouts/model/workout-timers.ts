import type { ActiveWorkout } from './active-workout';

// Los dos plazos de un entreno sin tocar (D-119), contados desde el último
// dato cambiado. Lógica pura.

const HOUR_MS = 3_600_000;
export const REMINDER_AFTER_MS = 6 * HOUR_MS;
export const TIMEOUT_AFTER_MS = 12 * HOUR_MS;

/** Cuándo avisar; `null` si ese momento ya pasó. */
export function reminderAt(workout: ActiveWorkout, nowMs: number): Date | null {
  const at = Date.parse(workout.lastChangedAt) + REMINDER_AFTER_MS;
  return at > nowMs ? new Date(at) : null;
}

/** Cuánto falta para las 12 horas (nunca menos de 0). */
export function timeoutDelay(lastChangedAt: string, nowMs: number): number {
  return Math.max(0, Date.parse(lastChangedAt) + TIMEOUT_AFTER_MS - nowMs);
}

export function isTimedOut(lastChangedAt: string, nowMs: number): boolean {
  return timeoutDelay(lastChangedAt, nowMs) === 0;
}

/** Un número fijo por negocio: un aviso por espacio, y el nuevo sustituye al anterior. */
export function reminderId(tenantId: string): number {
  let hash = 7;
  for (const char of tenantId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 2_000_000_000;
  }
  return hash + 1;
}

/** El día de la semana del entreno, en el idioma y la zona del móvil: "lunes". */
export function weekdayName(at: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(at));
}
