import { Haptics } from '@capacitor/haptics';

import { logger } from '../lib';
import { isNativeApp } from './platform';

// Vibración del móvil (D-123, D-135). En el navegador no hace nada.

/** Una vibración larga, para avisar de que acaba el descanso. */
export async function vibrate(durationMs = 500): Promise<void> {
  if (!isNativeApp()) {
    return;
  }
  try {
    await Haptics.vibrate({ duration: durationMs });
  } catch (error) {
    logger.error('Native call failed', {
      action: 'vibrate',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
