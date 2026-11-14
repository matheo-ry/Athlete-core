import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';

import { AppProviders } from '@/app/providers';
import { buildRoutes } from '@/app/router';
import type { FlagsSource } from '@/core/flags';
import { loadModuleTranslations } from '@/core/i18n';
import type { TenancySource } from '@/core/tenancy';
import { registeredModules } from '@/modules';

import { createFakeAuthService } from './fake-auth-service';
import type { FakeAuthService } from './fake-auth-service';
import { createFakeFlagsSource } from './fake-flags-source';
import { createFakeTenancySource } from './fake-tenancy-source';

interface RenderAppOptions {
  /** La sesión falsa. Por defecto, la cuenta de coach de Iron Lab con la sesión abierta. */
  auth?: FakeAuthService;
  /** Los espacios falsos. Por defecto, los de `fake-tenancy-source.ts`. */
  tenancy?: TenancySource;
  /** Los flags falsos. Por defecto, ninguno activo. */
  flags?: FlagsSource;
}

/**
 * Monta la app entera (proveedores + rutas + módulos registrados) en una ruta
 * dada, como la vería un usuario. Para tests de pantallas y de navegación.
 * No habla con Supabase: la sesión y los espacios son falsos.
 */
export async function renderApp(initialPath = '/', options: RenderAppOptions = {}) {
  await loadModuleTranslations(registeredModules);

  const auth = options.auth ?? createFakeAuthService();
  const tenancy = options.tenancy ?? createFakeTenancySource();
  const flags = options.flags ?? createFakeFlagsSource();
  const router = createMemoryRouter(buildRoutes(registeredModules), {
    initialEntries: [initialPath],
  });
  // Sin reintentos: un fallo en un test debe verse a la primera.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const view = render(
    <AppProviders
      queryClient={queryClient}
      authService={auth}
      tenancySource={tenancy}
      flagsSource={flags}
    >
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { ...view, router, auth, user: userEvent.setup() };
}

/** Atajo: la app con la sesión abierta de una cuenta de `fake-auth-service.ts`. */
export function renderAppAs(email: string, initialPath = '/') {
  return renderApp(initialPath, { auth: createFakeAuthService({ signedInAs: email }) });
}
