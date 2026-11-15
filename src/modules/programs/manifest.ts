import { defineModule } from '@/core/modules';

// Ficha del módulo. La clave ('programs') es también su feature flag y el
// prefijo de sus textos (`programs.…`). De momento solo tiene pantallas de
// coach: el cliente verá su rutina en el PR 2.15.
export const programsModule = defineModule({
  key: 'programs',
  routes: {
    coach: [
      {
        path: 'programs',
        lazy: () =>
          import('./coach/TemplateListPage').then((page) => ({
            Component: page.TemplateListPage,
          })),
      },
      {
        path: 'programs/:programId',
        lazy: () =>
          import('./coach/ProgramEditorPage').then((page) => ({
            Component: page.ProgramEditorPage,
          })),
      },
    ],
    client: [],
  },
  nav: {
    // Orden 20: entre Clientes (10) y Ejercicios (30) (D-085).
    coach: [
      { to: '/coach/programs', labelKey: 'programs.nav.coach', icon: 'clipboard', order: 20 },
    ],
    client: [],
  },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  clientProfileTabs: [],
});
