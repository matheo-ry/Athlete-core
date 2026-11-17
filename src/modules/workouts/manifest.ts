import { defineModule } from '@/core/modules';

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
  homeCards: { coach: [], client: [] },
});
