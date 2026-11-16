import { defineModule } from '@/core/modules';

// Ficha del módulo. La clave ('exercises') es también su feature flag y el
// prefijo de sus textos (`exercises.…`). De momento solo tiene pantallas de
// coach: el cliente verá los ejercicios dentro de su rutina (PR 2.15).
export const exercisesModule = defineModule({
  key: 'exercises',
  routes: {
    coach: [
      {
        path: 'exercises',
        lazy: () =>
          import('./coach/ExerciseListPage').then((page) => ({
            Component: page.ExerciseListPage,
          })),
      },
    ],
    client: [],
  },
  nav: {
    // Orden 30: después de Rutinas (20), que llega en el PR 2.7 (D-085).
    coach: [
      { to: '/coach/exercises', labelKey: 'exercises.nav.coach', icon: 'dumbbell', order: 30 },
    ],
    client: [],
  },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  clientProfileTabs: [],
  homeCards: { coach: [], client: [] },
});
