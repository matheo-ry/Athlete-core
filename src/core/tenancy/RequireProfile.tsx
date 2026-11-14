import { Navigate, Outlet } from 'react-router';

import { homePathFor } from './membership';
import type { Profile } from './tenancy-types';
import { useTenancy } from './useTenancy';

interface RequireProfileProps {
  /** El perfil que puede abrir esta zona. `null`: solo quien no tiene ningún espacio. */
  profile: Profile | null;
}

/**
 * Guarda por rol (D-056): `/coach/...` solo con un espacio de coach, `/client/...`
 * solo con uno de cliente y `/welcome` solo sin espacio. Si no, al inicio que le
 * toca. Es comodidad, no seguridad: los datos los protege el RLS.
 */
export function RequireProfile({ profile }: RequireProfileProps) {
  const tenancy = useTenancy();
  if (tenancy.profile !== profile) {
    return <Navigate to={homePathFor(tenancy)} replace />;
  }
  return <Outlet />;
}
