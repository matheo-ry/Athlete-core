import { Navigate, Outlet, useLocation } from 'react-router';

import { Spinner } from '../ui';
import { readNextPath } from './next-path';
import { useAuth } from './useAuth';

/** Guarda de las pantallas de entrar: con sesión no tienen sentido, se va al inicio. */
export function RequireGuest() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <Spinner />;
  }
  if (status === 'signed-in') {
    return <Navigate to={readNextPath(location.search) ?? '/'} replace />;
  }
  return <Outlet />;
}
