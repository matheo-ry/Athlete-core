import { App } from '@capacitor/app';

import { logger } from '../lib';
import { isNativeApp } from './platform';

// Avisa cada vez que el usuario vuelve a la app (DECISIONES D-118): es cuando
// se pone al día lo guardado para entrenar y se sube lo pendiente. En la app
// instalada lo dice Android; en el navegador, que la pestaña vuelve a verse.

/** Llama a `listener` al volver a la app. Devuelve cómo dejar de escuchar. */
export function onAppResume(listener: () => void): () => void {
  if (!isNativeApp()) {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        listener();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }

  let removed = false;
  let remove: (() => Promise<void>) | null = null;
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      listener();
    }
  })
    .then((handle) => {
      remove = () => handle.remove();
      // Si ya se dejó de escuchar mientras Android respondía.
      if (removed) {
        void remove();
      }
    })
    .catch((error: unknown) => {
      logger.error('Native call failed', {
        action: 'appStateChange',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  return () => {
    removed = true;
    if (remove !== null) {
      void remove();
    }
  };
}
