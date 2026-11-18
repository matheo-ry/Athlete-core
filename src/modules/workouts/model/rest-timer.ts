// El cronómetro de descanso (D-123). Lógica pura: nada de relojes ni de
// pantalla. La cuenta se calcula con la hora en que acaba, no contando
// segundos: al volver a la app, o tras apagar la pantalla, sigue siendo correcta.

/** Un descanso en marcha o en pausa. */
export interface RestTimer {
  /** El entreno al que pertenece. */
  workoutId: string;
  /** Cuándo llega a cero, en ms desde 1970; `null` si está en pausa. */
  endsAtMs: number | null;
  /** Lo que queda; solo vale mientras está en pausa. */
  pausedRemainingMs: number;
}

/** Descanso máximo: una hora, lo mismo que admite la base de datos. */
export const MAX_REST_SECONDS = 3600;
/** Lo que suman y restan los botones +15 s y −15 s. */
export const REST_ADJUST_SECONDS = 15;
/** Atajos de la barra (D-123): 1:00, 1:30, 2:00 y 3:00. */
export const REST_SHORTCUTS = [60, 90, 120, 180] as const;

export function startRest(workoutId: string, seconds: number, nowMs: number): RestTimer {
  const clamped = clampSeconds(seconds);
  return { workoutId, endsAtMs: nowMs + clamped * 1000, pausedRemainingMs: clamped * 1000 };
}

function clampSeconds(seconds: number): number {
  return Math.min(MAX_REST_SECONDS, Math.max(0, Math.round(seconds)));
}

/** Lo que queda, nunca menos de 0. */
export function remainingMs(timer: RestTimer, nowMs: number): number {
  return timer.endsAtMs === null ? timer.pausedRemainingMs : Math.max(0, timer.endsAtMs - nowMs);
}

export function isPaused(timer: RestTimer): boolean {
  return timer.endsAtMs === null;
}

export function isFinished(timer: RestTimer, nowMs: number): boolean {
  return remainingMs(timer, nowMs) === 0;
}

export function pauseRest(timer: RestTimer, nowMs: number): RestTimer {
  return isPaused(timer)
    ? timer
    : { ...timer, endsAtMs: null, pausedRemainingMs: remainingMs(timer, nowMs) };
}

export function resumeRest(timer: RestTimer, nowMs: number): RestTimer {
  return isPaused(timer) ? { ...timer, endsAtMs: nowMs + timer.pausedRemainingMs } : timer;
}

/** +15 s o −15 s sobre lo que queda; sin pasar de una hora ni bajar de 0. */
export function adjustRest(timer: RestTimer, deltaSeconds: number, nowMs: number): RestTimer {
  const next = Math.min(
    MAX_REST_SECONDS * 1000,
    Math.max(0, remainingMs(timer, nowMs) + deltaSeconds * 1000),
  );
  return isPaused(timer)
    ? { ...timer, pausedRemainingMs: next }
    : { ...timer, endsAtMs: nowMs + next };
}

/** Un atajo: el descanso entero pasa a ser ese. */
export function setRest(timer: RestTimer, seconds: number, nowMs: number): RestTimer {
  const next = clampSeconds(seconds) * 1000;
  return isPaused(timer)
    ? { ...timer, pausedRemainingMs: next }
    : { ...timer, endsAtMs: nowMs + next };
}

/**
 * Qué descanso toca (D-123): el cambiado a mano en este entreno; si no, el
 * que puso el coach en el ejercicio; si no, el del cliente (2:00 de partida).
 */
export function restSecondsFor(input: {
  manualSeconds: number | null;
  coachSeconds: number | null;
  clientDefaultSeconds: number;
}): number {
  return clampSeconds(input.manualSeconds ?? input.coachSeconds ?? input.clientDefaultSeconds);
}

/**
 * ¿Arranca el descanso? Solo con el primer cambio de una serie (o con
 * "Igual"): corregir una serie que ya estaba iluminada no lo reinicia.
 */
export function shouldStartRest(input: { wasDone: boolean; autostart: boolean }): boolean {
  return input.autostart && !input.wasDone;
}

/** "1:30", o "0:05" al final. Redondea hacia arriba para no enseñar 0:00 antes de tiempo. */
export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}
