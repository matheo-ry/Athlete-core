import { Navigate } from 'react-router';

import { useAuth } from '@/core/auth';
import { WhenTenancyReady, homePathFor, useTenancy } from '@/core/tenancy';
import { Spinner } from '@/core/ui';

/**
 * "/" lleva a cada uno a su sitio (ARQUITECTURA §7, DECISIONES D-037 y D-056):
 * sin sesión, a la primera pantalla; con sesión, a su zona de coach o de
 * cliente, o a la bienvenida si todavía no tiene ningún espacio.
 */
export function RootRedirect() {
  const { status } = useAuth();
  const tenancy = useTenancy();

  if (status === 'loading') {
    return <Spinner className="min-h-dvh" />;
  }
  if (status === 'signed-out') {
    // La primera pantalla: el código del coach (D-037).
    return <Navigate to="/start" replace />;
  }
  return (
    <WhenTenancyReady>
      <Navigate to={homePathFor(tenancy)} replace />
    </WhenTenancyReady>
  );
}
