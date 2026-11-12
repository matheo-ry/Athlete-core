import { Suspense, lazy } from 'react';
import { Outlet } from 'react-router';

// El selector de desarrollo solo se importa en desarrollo. En la compilación de
// producción `import.meta.env.DEV` es `false` y este import desaparece entero.
const DevToolbar = import.meta.env.DEV
  ? lazy(() => import('./DevToolbar').then((module) => ({ default: module.DevToolbar })))
  : null;

/** Marco común a todas las rutas. */
export function RootLayout() {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      {DevToolbar ? (
        <Suspense fallback={null}>
          <DevToolbar />
        </Suspense>
      ) : null}
      <Outlet />
    </div>
  );
}
