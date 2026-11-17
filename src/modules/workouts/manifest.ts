import { defineModule } from '@/core/modules';
import { canLogWorkouts } from '@/core/native';

/**
 * Módulo workouts (Fase 3): registro de entrenos por el cliente y seguimiento
 * por el coach (PR 3.13, D-109, D-124, D-126, D-127, D-128). Las pantallas del
 * cliente llegan con el PR 3.5; ya guarda en el móvil lo necesario para entrenar
 * sin cobertura y sube lo pendiente (PR 3.4b, D-118 y D-143).
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
  services: [
    {
      key: 'workouts-sync',
      // Solo donde se puede entrenar (D-116): en la web publicada no hay nada que guardar ni subir.
      enabled: canLogWorkouts,
      lazy: () =>
        import('./shared/WorkoutsService').then((service) => ({
          Component: service.WorkoutsService,
        })),
    },
  ],
});
