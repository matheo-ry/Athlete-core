import { Navigate } from 'react-router';

import { useAuth } from '@/core/auth';
import { WhenTenancyReady, homePathFor, usePendingInvite, useTenancy } from '@/core/tenancy';
import { Spinner } from '@/core/ui';

/**
 * "/" lleva a cada uno a su sitio (ARQUITECTURA §7, DECISIONES D-037 y D-056):
 * - sin sesión, a la primera pantalla (el código del coach);
 * - con sesión y un código recordado (se cerró la app a mitad de crear la
 *   cuenta), a terminar el alta con ese coach;
 * - si no, a su zona de coach o de cliente, o a la bienvenida si todavía no
 *   tiene ningún espacio.
 */
export function RootRedirect() {
  const { status } = useAuth();
  const tenancy = useTenancy();
  const pending = usePendingInvite();

  if (status === 'loading') {
    return <Spinner className="min-h-dvh" />;
  }
  if (status === 'signed-out') {
    return <Navigate to="/start" replace />;
  }
  if (pending !== null) {
    return <Navigate to={`/join?code=${pending.code}`} replace />;
  }
  return (
    <WhenTenancyReady>
      <Navigate to={homePathFor(tenancy)} replace />
    </WhenTenancyReady>
  );
}
