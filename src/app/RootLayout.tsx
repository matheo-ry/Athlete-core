import { Outlet } from 'react-router';

import { Ambient, OfflineBanner } from '@/core/ui';

import { ModuleServices } from './ModuleServices';

/** Marco común a todas las rutas. */
export function RootLayout() {
  return (
    // `isolate`: el fondo y las fotos de cabecera (z negativo) quedan detrás
    // del contenido pero delante del color de la página.
    <div className="text-foreground relative isolate flex min-h-dvh flex-col">
      <Ambient />
      {/* Franja bajo la barra de estado del móvil (en el ordenador mide 0): lo
          que pasa por debajo de la hora se desenfoca y se lee la barra. */}
      <div
        aria-hidden="true"
        className="bg-background/45 fixed inset-x-0 top-0 z-50 h-[var(--safe-top)] backdrop-blur-xl"
      />
      <div className="pointer-events-none fixed inset-x-0 top-[var(--safe-top)] z-50 [&>*]:pointer-events-auto">
        <OfflineBanner />
      </div>
      <Outlet />
      <ModuleServices />
    </div>
  );
}
