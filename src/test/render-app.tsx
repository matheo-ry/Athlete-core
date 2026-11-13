import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';

import { AppProviders } from '@/app/providers';
import { buildRoutes } from '@/app/router';
import { loadModuleTranslations } from '@/core/i18n';
import { registeredModules } from '@/modules';

/**
 * Monta la app entera (proveedores + rutas + módulos registrados) en una ruta
 * dada, como la vería un usuario. Para tests de pantallas y de navegación.
 */
export async function renderApp(initialPath = '/') {
  await loadModuleTranslations(registeredModules);

  const router = createMemoryRouter(buildRoutes(registeredModules), {
    initialEntries: [initialPath],
  });
  // Sin reintentos: un fallo en un test debe verse a la primera.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const view = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { ...view, router, user: userEvent.setup() };
}
