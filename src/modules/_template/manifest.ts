import { defineModule } from '@/core/modules';

// Ficha del módulo. La clave ('template') es también su feature flag y el
// prefijo de sus textos (`template.…`).
export const templateModule = defineModule({
  key: 'template',
  routes: {
    coach: [
      {
        path: 'template',
        lazy: () =>
          import('./coach/TemplateCoachPage').then((page) => ({
            Component: page.TemplateCoachPage,
          })),
      },
    ],
    client: [
      {
        path: 'template',
        lazy: () =>
          import('./client/TemplateClientPage').then((page) => ({
            Component: page.TemplateClientPage,
          })),
      },
    ],
  },
  nav: {
    coach: [{ to: '/coach/template', labelKey: 'template.nav.coach', icon: 'layout', order: 90 }],
    client: [
      { to: '/client/template', labelKey: 'template.nav.client', icon: 'layout', order: 90 },
    ],
  },
  i18n: {
    en: () => import('./i18n/en.json'),
    es: () => import('./i18n/es.json'),
  },
  // Pestañas que este módulo añade a la ficha de un cliente (vista del coach).
  clientProfileTabs: [],
  homeCards: { coach: [], client: [] },
});
