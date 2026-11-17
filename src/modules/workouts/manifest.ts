import { defineModule } from '@/core/modules';

// Ficha del módulo workouts (PR 3.14, D-114, D-128).
export const workoutsModule = defineModule({
  key: 'workouts',
  routes: {
    coach: [],
    client: [],
  },
  nav: {
    coach: [],
    client: [],
  },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  clientProfileTabs: [],
  homeCards: {
    coach: [
      {
        key: 'workouts-activity',
        order: 5,
        lazy: () =>
          import('./coach/CoachActivityCard').then((card) => ({
            Component: card.CoachActivityCard,
          })),
      },
    ],
    client: [],
  },
});
