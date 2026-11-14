import { Navigate, Outlet, useLocation } from 'react-router';

import { Spinner } from '../ui';
import { loginPathFor } from './next-path';
import { useAuth } from './useAuth';

/**
 * Guarda: sin sesión, a /login. Al entrar se vuelve a la pantalla pedida, salvo
 * si el usuario acaba de cerrar sesión él mismo (D-056).
 * Es comodidad, no seguridad: los datos los protege el RLS de la base de datos.
 */
export function RequireAuth() {
  const { status, signedOutReason } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <Spinner />;
  }
  if (status === 'signed-out') {
    const target =
      signedOutReason === 'explicit' ? '/login' : loginPathFor(location.pathname + location.search);
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}
