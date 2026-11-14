import { defineModule } from '@/core/modules';

// Ficha del módulo. La clave ('clients') es también su feature flag y el
// prefijo de sus textos (`clients.…`). Solo tiene pantallas de coach: el
// cliente no ve la lista de clientes (D-059).
export const clientsModule = defineModule({
  key: 'clients',
  routes: {
    coach: [
      {
        path: 'clients',
        lazy: () =>
          import('./coach/ClientListPage').then((page) => ({
            Component: page.ClientListPage,
          })),
      },
    ],
    client: [],
  },
  nav: {
    coach: [{ to: '/coach/clients', labelKey: 'clients.nav.coach', icon: 'users', order: 10 }],
    client: [],
  },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  // Las pestañas de la ficha de un cliente las aportan otros módulos (Fases 2 y 3).
  clientProfileTabs: [],
});
