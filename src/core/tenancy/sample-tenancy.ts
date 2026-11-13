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
      colors: { primary: '#DC2626', accent: '#F59E0B' },
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

/**
 * Rol de ejemplo al arrancar. Sin sesión real no hay forma de saber quién entra,
 * así que se deduce de la dirección: quien abre `/client/...` entra como cliente.
 * Así una recarga de la página no cambia de perfil.
 */
export function getSampleInitialRole(pathname: string): Role {
  return pathname === '/client' || pathname.startsWith('/client/') ? 'client' : 'owner';
}
