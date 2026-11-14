import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';

import { AppProviders } from '@/app/providers';
import { buildRoutes } from '@/app/router';
import { loadModuleTranslations } from '@/core/i18n';
import { registeredModules } from '@/modules';

import { createFakeAuthService } from './fake-auth-service';
import type { FakeAuthService } from './fake-auth-service';

interface RenderAppOptions {
  /** La sesión falsa. Por defecto, una cuenta de coach con la sesión abierta. */
  auth?: FakeAuthService;
}

/**
 * Monta la app entera (proveedores + rutas + módulos registrados) en una ruta
 * dada, como la vería un usuario. Para tests de pantallas y de navegación.
 * No habla con Supabase: la sesión es falsa (`fake-auth-service.ts`).
 */
export async function renderApp(initialPath = '/', options: RenderAppOptions = {}) {
  await loadModuleTranslations(registeredModules);

  const auth = options.auth ?? createFakeAuthService();
  const router = createMemoryRouter(buildRoutes(registeredModules), {
    initialEntries: [initialPath],
  });
  // Sin reintentos: un fallo en un test debe verse a la primera.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const view = render(
    <AppProviders queryClient={queryClient} authService={auth}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { ...view, router, auth, user: userEvent.setup() };
}
