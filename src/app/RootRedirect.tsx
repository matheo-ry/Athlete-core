import { Navigate } from 'react-router';

import { useTenancy } from '@/core/tenancy';

/**
 * La ruta "/" lleva a la zona del perfil activo (ARQUITECTURA §7). Quien todavía
 * no pertenece a ningún tenant va a la bienvenida.
 */
export function RootRedirect() {
  const { profile } = useTenancy();
  return <Navigate to={profile === null ? '/welcome' : `/${profile}`} replace />;
}
