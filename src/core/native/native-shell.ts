import { App } from '@capacitor/app';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';

import { logger } from '../lib';
import { isNativeApp } from './platform';

// Lo que necesita la app instalada para comportarse como el resto de apps del
// móvil. En el navegador no hace nada. Las zonas seguras (barra de estado y
// barra de gestos) las pone Capacitor como variables CSS (`--safe-area-inset-*`)
// y las usa `src/index.css`.

/** Se llama una vez, al arrancar la app. */
export function startNativeShell(): void {
  if (!isNativeApp()) {
    return;
  }
  listenToBackButton();
  followColorScheme(document.documentElement);
}

/** El botón "atrás" de Android vuelve a la pantalla anterior, como en el navegador. */
function listenToBackButton(): void {
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
      return;
    }
    // En la primera pantalla, la app pasa a segundo plano (como hace Android con
    // las demás apps) en vez de cerrarse: así no se pierde la sesión abierta.
    App.minimizeApp().catch(logNativeError('minimizeApp'));
  }).catch(logNativeError('backButton'));
}

/**
 * La barra de estado está encima del fondo de la app, que cambia con la marca
 * del coach (modo claro u oscuro). `core/branding` deja el modo en
 * `color-scheme` del documento; aquí se sigue para que la hora y los iconos de
 * la barra se lean siempre.
 */
export function followColorScheme(root: HTMLElement): () => void {
  let current: SystemBarsStyle | null = null;
  const apply = () => {
    const style = statusBarStyleFor(root.style.colorScheme);
    if (style === current) {
      return;
    }
    current = style;
    SystemBars.setStyle({ style }).catch(logNativeError('setStyle'));
  };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(root, { attributes: true, attributeFilter: ['style'] });
  return () => observer.disconnect();
}

/** Texto claro sobre fondo oscuro, y al revés. Sin marca todavía, la app es oscura. */
export function statusBarStyleFor(colorScheme: string): SystemBarsStyle {
  return colorScheme === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark;
}

function logNativeError(action: string): (error: unknown) => void {
  return (error) => {
    logger.error('Native call failed', {
      action,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  };
}
