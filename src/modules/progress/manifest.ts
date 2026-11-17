import { defineModule } from '@/core/modules';

// Ficha del módulo progress (D-129).
// El cliente ve su progreso en /client/progress y el coach en la pestaña
// "Progreso" de la ficha del cliente.
export const progressModule = defineModule({
  key: 'progress',
  routes: {
    coach: [],
    client: [
      {
        path: 'progress',
        lazy: () =>
          import('./client/ClientProgressPage').then((page) => ({
            Component: page.ClientProgressPage,
          })),
      },
    ],
  },
  nav: {
    coach: [],
    client: [
      {
        to: '/client/progress',
        labelKey: 'progress.nav.client',
        icon: 'chart',
        order: 20,
      },
    ],
  },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  // Pestaña "Progreso" en la ficha del cliente (vista del coach, D-129).
  clientProfileTabs: [
    {
      key: 'progress',
      labelKey: 'progress.clientTab.label',
      lazy: () =>
        import('./coach/ClientProgressTab').then((tab) => ({
          Component: tab.ClientProgressTab,
        })),
    },
  ],
  homeCards: { coach: [], client: [] },
});
