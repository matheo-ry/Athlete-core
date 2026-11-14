import { Navigate } from 'react-router';

import { useAuth } from '@/core/auth';
import {
  WhenTenancyReady,
  hasCoachIntent,
  usePendingInvite,
  useTenancyContext,
} from '@/core/tenancy';
import { Spinner } from '@/core/ui';

/**
 * "/" lleva a cada uno a su sitio (ARQUITECTURA §7, DECISIONES D-037 y D-056):
 * - sin sesión, a la primera pantalla (el código del coach);
 * - con sesión y algo a medias de antes de crear la cuenta (se cerró la app):
 *   un código recordado lleva a terminar el alta; "Soy coach", a crear el negocio;
 * - si no, a su zona de coach o de cliente; al selector si tiene varios
 *   espacios y ninguno elegido en este dispositivo; o a la bienvenida si
 *   todavía no tiene ningún espacio.
 */
export function RootRedirect() {
  const { status } = useAuth();
  const { homePath, memberships } = useTenancyContext();
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
  const wantsBusiness =
    hasCoachIntent() && !memberships.some((membership) => membership.role === 'owner');
  return (
    <WhenTenancyReady>
      <Navigate to={wantsBusiness ? '/create-business' : homePath} replace />
    </WhenTenancyReady>
  );
}
