import { Outlet } from 'react-router';

import { OfflineBanner } from '@/core/ui';

import { ModuleServices } from './ModuleServices';

/** Marco común a todas las rutas. */
export function RootLayout() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      {/* Franja fija bajo la barra de estado del móvil (en el ordenador mide 0):
          así nada de la app queda debajo de la hora ni de los iconos. */}
      <div className="bg-surface sticky top-0 z-50 pt-[var(--safe-top)]">
        <OfflineBanner />
      </div>
      <Outlet />
      <ModuleServices />
    </div>
  );
}
