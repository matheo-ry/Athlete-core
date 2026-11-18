import { LocalNotifications } from '@capacitor/local-notifications';

import { logger } from '../lib';
import { isNativeApp } from './platform';

// Avisos que programa el propio móvil, sin servidor y sin cobertura (D-135).
// En el navegador no hacen nada.

export interface LocalNotificationInput {
  /** Programar otra con el mismo número sustituye a la anterior. */
  id: number;
  title: string;
  body: string;
  at: Date;
}

function logNativeError(action: string, error: unknown): void {
  logger.error('Native call failed', {
    action,
    message: error instanceof Error ? error.message : 'Unknown error',
  });
}

/** Android 13 o más pide permiso: se pregunta la primera vez que hace falta. */
async function canNotify(): Promise<boolean> {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') {
    return true;
  }
  if (current.display === 'denied') {
    return false;
  }
  return (await LocalNotifications.requestPermissions()).display === 'granted';
}

/** Programa el aviso. Sin permiso no pasa nada: el entreno sigue igual. */
export async function scheduleLocalNotification(input: LocalNotificationInput): Promise<void> {
  if (!isNativeApp()) {
    return;
  }
  try {
    if (await canNotify()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: input.id,
            title: input.title,
            body: input.body,
            // Aunque el móvil esté en reposo.
            schedule: { at: input.at, allowWhileIdle: true },
          },
        ],
      });
    }
  } catch (error) {
    logNativeError('scheduleNotification', error);
  }
}

export async function cancelLocalNotification(id: number): Promise<void> {
  if (!isNativeApp()) {
    return;
  }
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (error) {
    logNativeError('cancelNotification', error);
  }
}
