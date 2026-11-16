import { defineModule } from '@/core/modules';

// Ficha del módulo. La clave ('programs') es también su feature flag y el
// prefijo de sus textos (`programs.…`). El coach crea y asigna rutinas; el
// cliente ve la suya en "Entreno" (PR 2.15).
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
    // "Entreno": la rutina del cliente, en lectura (PR 2.15, D-084).
    client: [
      {
        path: 'program',
        lazy: () =>
          import('./client/ClientProgramPage').then((page) => ({
            Component: page.ClientProgramPage,
          })),
      },
    ],
  },
  nav: {
    // Orden 20: entre Clientes (10) y Ejercicios (30) (D-085).
    coach: [
      { to: '/coach/programs', labelKey: 'programs.nav.coach', icon: 'clipboard', order: 20 },
    ],
    // La primera entrada después del inicio (PR 2.15).
    client: [
      { to: '/client/program', labelKey: 'programs.nav.client', icon: 'dumbbell', order: 10 },
    ],
  },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  // La pestaña "Rutina" de la ficha del cliente (PR 2.14, D-085).
  clientProfileTabs: [
    {
      key: 'program',
      labelKey: 'programs.clientTab.label',
      lazy: () =>
        import('./coach/ClientProgramTab').then((tab) => ({ Component: tab.ClientProgramTab })),
    },
  ],
  // El inicio de cada perfil (PR 2.18, D-085 y D-084).
  homeCards: {
    coach: [
      {
        key: 'programs-alerts',
        order: 10,
        lazy: () =>
          import('./coach/CoachAlertsCard').then((card) => ({ Component: card.CoachAlertsCard })),
      },
    ],
    client: [
      {
        key: 'programs-today',
        order: 10,
        lazy: () =>
          import('./client/ClientTodayCard').then((card) => ({ Component: card.ClientTodayCard })),
      },
    ],
  },
});
