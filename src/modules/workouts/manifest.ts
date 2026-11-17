import { defineModule } from '@/core/modules';

/**
 * Módulo workouts (Fase 3): registro de entrenos por el cliente y seguimiento
 * por el coach (PR 3.13, D-109, D-124, D-126, D-127, D-128).
 */
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
  clientProfileTabs: [
    {
      key: 'workouts',
      labelKey: 'workouts.clientTab.label',
      lazy: () =>
        import('./coach/ClientWorkoutsTab').then((tab) => ({ Component: tab.ClientWorkoutsTab })),
    },
  ],
  homeCards: {
    coach: [],
    client: [],
  },
});
