import { RouterProvider, createBrowserRouter } from 'react-router';
import type { RouteObject } from 'react-router';

import { collectRoutes } from '@/core/modules';
import type { ModuleManifest } from '@/core/modules';
import type { Profile } from '@/core/tenancy';
import { Spinner } from '@/core/ui';

import { ClientHomePage } from './client/ClientHomePage';
import { ClientLayout } from './client/ClientLayout';
import { CoachHomePage } from './coach/CoachHomePage';
import { CoachLayout } from './coach/CoachLayout';
import { JoinPage } from './public/JoinPage';
import { NotFoundPage } from './public/NotFoundPage';
import { PublicLayout } from './public/PublicLayout';
import { WelcomePage } from './public/WelcomePage';
import { RootLayout } from './RootLayout';
import { RootRedirect } from './RootRedirect';
import { RouteErrorPage } from './RouteErrorPage';
import { useActiveModules } from './useActiveModules';

type AppRouterInstance = ReturnType<typeof createBrowserRouter>;

function moduleRoutes(modules: readonly ModuleManifest[], profile: Profile): RouteObject[] {
  return collectRoutes(modules, profile).map(({ path, lazy }) => ({ path, lazy }));
}

/**
 * Rutas de la app. Las de cada función NO se escriben aquí: las aporta su módulo
 * a través del manifest. Las guardas por sesión y rol llegan en la Fase 1; hasta
 * entonces separar las zonas es comodidad, no seguridad (ARQUITECTURA §7).
 */
export function buildRoutes(modules: readonly ModuleManifest[]): RouteObject[] {
  return [
    {
      element: <RootLayout />,
      // Si una pantalla falla al cargar o al pintarse, se ve esto y no un error en crudo.
      errorElement: <RouteErrorPage />,
      hydrateFallbackElement: <Spinner />,
      children: [
        { index: true, element: <RootRedirect /> },
        {
          path: 'coach',
          element: <CoachLayout />,
          children: [
            { index: true, element: <CoachHomePage /> },
            ...moduleRoutes(modules, 'coach'),
          ],
        },
        {
          path: 'client',
          element: <ClientLayout />,
          children: [
            { index: true, element: <ClientHomePage /> },
            ...moduleRoutes(modules, 'client'),
          ],
        },
        {
          element: <PublicLayout />,
          children: [
            { path: 'welcome', element: <WelcomePage /> },
            { path: 'join', element: <JoinPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}

// Un router por cada lista de módulos activos. Crear un router lo deja escuchando
// al navegador, así que no debe crearse dos veces para la misma lista (React
// repite los cálculos en desarrollo). Con esta caché se crea una sola vez.
const routers = new WeakMap<readonly ModuleManifest[], AppRouterInstance>();

function getRouter(modules: readonly ModuleManifest[]): AppRouterInstance {
  let router = routers.get(modules);
  if (router === undefined) {
    router = createBrowserRouter(buildRoutes(modules));
    routers.set(modules, router);
  }
  return router;
}

export function AppRouter() {
  const modules = useActiveModules();
  return <RouterProvider router={getRouter(modules)} />;
}
