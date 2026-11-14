import { Navigate, Outlet } from 'react-router';

import { ErrorState, Spinner } from '../ui';
import { homePathFor } from './membership';
import type { Profile } from './tenancy-types';
import { useTenancyContext } from './useTenancy';

interface RequireProfileProps {
  /** El perfil que puede abrir esta zona. `null`: solo quien no tiene ningún espacio. */
  profile: Profile | null;
}

/**
 * Guarda por rol (D-056): `/coach/...` solo con un espacio de coach, `/client/...`
 * solo con uno de cliente y `/welcome` solo sin espacio. Si no, al inicio que le
 * toca. Espera a saber los espacios. Es comodidad, no seguridad: los datos los
 * protege el RLS.
 */
export function RequireProfile({ profile }: RequireProfileProps) {
  const { tenancy, status, refresh } = useTenancyContext();

  if (status === 'loading') {
    return <Spinner className="min-h-dvh" />;
  }
  if (status === 'error') {
    return <ErrorState className="min-h-dvh justify-center" onRetry={() => void refresh()} />;
  }
  if (tenancy.profile !== profile) {
    return <Navigate to={homePathFor(tenancy)} replace />;
  }
  return <Outlet />;
}
