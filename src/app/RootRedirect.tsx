import { Navigate } from 'react-router';

import { useAuth } from '@/core/auth';
import { homePathFor, useTenancy } from '@/core/tenancy';

/**
 * "/" lleva a cada uno a su sitio (ARQUITECTURA §7, DECISIONES D-056): sin sesión,
 * a entrar; con sesión, a su zona de coach o de cliente, o a la bienvenida si
 * todavía no tiene ningún espacio.
 */
export function RootRedirect() {
  const { status } = useAuth();
  const tenancy = useTenancy();

  if (status !== 'signed-in') {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={homePathFor(tenancy)} replace />;
}
