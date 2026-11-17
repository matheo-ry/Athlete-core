import { defineModule } from '@/core/modules';
import { canLogWorkouts } from '@/core/native';

// Ficha del módulo. La clave ('workouts') es también su feature flag y el
// prefijo de sus textos (`workouts.…`). Todavía sin pantallas: llegan con el
// PR 3.5. Por ahora guarda en el móvil lo necesario para entrenar sin
// cobertura y sube lo pendiente (PR 3.4b, D-118 y D-143).
export const workoutsModule = defineModule({
  key: 'workouts',
  routes: { coach: [], client: [] },
  nav: { coach: [], client: [] },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  clientProfileTabs: [],
  homeCards: { coach: [], client: [] },
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
