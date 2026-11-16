import { Capacitor } from '@capacitor/core';

import { env } from '../config';

// Dónde se está usando la app: la app instalada en el móvil o un navegador.
// El resto del código pregunta aquí y no a Capacitor (ARQUITECTURA §12).

/** `true` dentro de la app instalada (Android; iOS en la Fase 4). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Si se puede empezar o registrar un entreno (DECISIONES D-116): siempre en la
 * app instalada; en el navegador, solo en desarrollo y en los tests, con
 * `VITE_ALLOW_WEB_WORKOUTS` (nunca en la web publicada, lo garantiza `core/config`).
 */
export function canLogWorkouts(): boolean {
  return isNativeApp() || env.allowWebWorkouts;
}
