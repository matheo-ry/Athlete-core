import { RouterProvider, createBrowserRouter } from 'react-router';
import type { RouteObject } from 'react-router';

import { RequireAuth, RequireGuest } from '@/core/auth';
import type { ModuleManifest } from '@/core/modules';
import { RequireProfile } from '@/core/tenancy';
import type { Profile } from '@/core/tenancy';
import { Spinner } from '@/core/ui';
import { registeredModules } from '@/modules';

import { ClientHomePage } from './client/ClientHomePage';
import { ClientLayout } from './client/ClientLayout';
import { CoachHomePage } from './coach/CoachHomePage';
import { CoachLayout } from './coach/CoachLayout';
import { ModuleGate } from './ModuleGate';
import { CodeSignInPage } from './public/CodeSignInPage';
import { JoinPage } from './public/JoinPage';
import { LegalPage } from './public/LegalPage';
import { LoginPage } from './public/LoginPage';
import { NotFoundPage } from './public/NotFoundPage';
import { PublicLayout } from './public/PublicLayout';
import { ResetPasswordPage } from './public/ResetPasswordPage';
import { SignupPage } from './public/SignupPage';
import { VerifyEmailPage } from './public/VerifyEmailPage';
import { WelcomePage } from './public/WelcomePage';
import { RequireFlags } from './RequireFlags';
import { RootLayout } from './RootLayout';
import { RootRedirect } from './RootRedirect';
import { RouteErrorPage } from './RouteErrorPage';

/**
 * Las rutas de cada módulo, cada grupo detrás de su flag (`ModuleGate`). Se
 * montan todas siempre y la guarda decide: así el router no depende de los flags.
 */
function moduleRoutes(modules: readonly ModuleManifest[], profile: Profile): RouteObject[] {
  return modules
    .filter((module) => module.routes[profile].length > 0)
    .map((module) => ({
      element: <ModuleGate moduleKey={module.key} profile={profile} />,
      children: module.routes[profile].map(({ path, lazy }) => ({ path, lazy })),
    }));
}

/**
 * Rutas de la app. Las de cada función NO se escriben aquí: las aporta su módulo
 * a través del manifest. Las guardas son comodidad, no seguridad: los datos los
 * protege el RLS de la base de datos (ARQUITECTURA §7).
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
          // Sin sesión, las zonas de coach y de cliente llevan a /login. Con
          // sesión, cada zona solo se abre con un espacio de su perfil (D-056)
          // y espera a saber qué funciones tiene el negocio.
          element: <RequireAuth />,
          children: [
            {
              element: <RequireProfile profile="coach" />,
              children: [
                {
                  element: <RequireFlags />,
                  children: [
                    {
                      path: 'coach',
                      element: <CoachLayout />,
                      children: [
                        { index: true, element: <CoachHomePage /> },
                        ...moduleRoutes(modules, 'coach'),
                      ],
                    },
                  ],
                },
              ],
            },
            {
              element: <RequireProfile profile="client" />,
              children: [
                {
                  element: <RequireFlags />,
                  children: [
                    {
                      path: 'client',
                      element: <ClientLayout />,
                      children: [
                        { index: true, element: <ClientHomePage /> },
                        ...moduleRoutes(modules, 'client'),
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          element: <PublicLayout />,
          children: [
            // Pantallas de entrar: con sesión llevan al inicio.
            {
              element: <RequireGuest />,
              children: [
                { path: 'login', element: <LoginPage /> },
                { path: 'login/code', element: <CodeSignInPage /> },
                { path: 'signup', element: <SignupPage /> },
              ],
            },
            // Recuperar la contraseña y confirmar el email siguen con sesión: el
            // último paso ocurre después de confirmar el código.
            { path: 'reset-password', element: <ResetPasswordPage /> },
            { path: 'verify', element: <VerifyEmailPage /> },
            // Se pueden leer con sesión y sin ella (D-060).
            { path: 'legal/terms', element: <LegalPage document="terms" /> },
            { path: 'legal/privacy', element: <LegalPage document="privacy" /> },
            {
              // La bienvenida es para quien tiene sesión y ningún espacio.
              element: <RequireAuth />,
              children: [
                {
                  element: <RequireProfile profile={null} />,
                  children: [{ path: 'welcome', element: <WelcomePage /> }],
                },
              ],
            },
            { path: 'join', element: <JoinPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}

// Crear un router lo deja escuchando al navegador, así que se crea UNA sola vez
// (React repite los cálculos en desarrollo). Las rutas no dependen de los flags.
let browserRouter: ReturnType<typeof createBrowserRouter> | null = null;

export function AppRouter() {
  browserRouter ??= createBrowserRouter(buildRoutes(registeredModules));
  return <RouterProvider router={browserRouter} />;
}
