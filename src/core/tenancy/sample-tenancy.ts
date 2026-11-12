import type { Role, Tenant } from './tenancy-types';

// DATOS DE EJEMPLO (Fase 0). Todo es inventado. En la Fase 1 este archivo
// desaparece: el tenant y el rol saldrán de la sesión y de la base de datos.

export const SAMPLE_TENANTS: readonly [Tenant, ...Tenant[]] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Iron Lab',
    branding: {
      appName: 'Iron Lab',
      logoPath: null,
      colors: { primary: '#2563EB', accent: '#FF7A1A' },
      mode: 'dark',
    },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Norte Strength',
    branding: {
      appName: 'Norte Strength',
      logoPath: null,
      colors: { primary: '#0F766E', accent: '#B45309' },
      mode: 'light',
    },
  },
];

export const SAMPLE_INITIAL_ROLE: Role = 'owner';
