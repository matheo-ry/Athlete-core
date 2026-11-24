import { defineModule } from '@/core/modules';
import { canLogWorkouts } from '@/core/native';

/**
 * Módulo workouts (Fase 3): registro de entrenos por el cliente y seguimiento
 * por el coach (PR 3.13, D-109, D-124, D-126, D-127, D-128). El cliente apunta
 * sus entrenos en la app del móvil (PR 3.5); guarda en el móvil lo necesario para entrenar
 * sin cobertura y sube lo pendiente (PR 3.4b, D-118 y D-143).
 */
export const workoutsModule = defineModule({
  key: 'workouts',
  routes: {
    coach: [],
    // Apuntar un entreno, solo en la app del móvil (PR 3.5, D-116, D-119 y D-120).
    client: [
      {
        path: 'workout',
        lazy: () =>
          import('./client/WorkoutPage').then((page) => ({ Component: page.WorkoutPage })),
      },
      // Peso corporal y medidas (PR 3.9b, D-127): también en la web, apuntarlos no es entrenar.
      {
        path: 'body',
        lazy: () => import('./client/BodyPage').then((page) => ({ Component: page.BodyPage })),
      },
    ],
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
    // "Hoy toca", con "Iniciar entreno" (D-119). Antes era de `programs`, con el mismo orden.
    client: [
      {
        key: 'workouts-today',
        order: 10,
        lazy: () =>
          import('./client/ClientTodayCard').then((card) => ({ Component: card.ClientTodayCard })),
      },
      // Peso corporal: el último, "Actualizar" y las medidas (D-127).
      {
        key: 'workouts-body-weight',
        order: 20,
        lazy: () =>
          import('./client/BodyWeightCard').then((card) => ({ Component: card.BodyWeightCard })),
      },
    ],
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
