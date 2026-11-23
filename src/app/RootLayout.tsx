import { MotionConfig } from 'motion/react';
import { Outlet } from 'react-router';

import { OfflineBanner } from '@/core/ui';

import { ModuleServices } from './ModuleServices';

/**
 * Marco común a todas las rutas. `MotionConfig` hace que todas las animaciones
 * de la app respeten "reducir movimiento" del sistema.
 */
export function RootLayout() {
  return (
    <MotionConfig reducedMotion="user">
      {/* Sin fondo propio: el del `body` lleva el resplandor de la marca. */}
      <div className="text-foreground flex min-h-dvh flex-col">
        {/* Franja fija bajo la barra de estado del móvil (en el ordenador mide 0):
            así nada de la app queda debajo de la hora ni de los iconos. */}
        <div className="sticky top-0 z-50 pt-[var(--safe-top)]">
          <OfflineBanner />
        </div>
        <Outlet />
        <ModuleServices />
      </div>
    </MotionConfig>
  );
}
