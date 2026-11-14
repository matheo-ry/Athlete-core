import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '../auth';
import { createSupabaseTenancySource } from './api/supabase-tenancy-source';
import { pickActiveMembership, tenancyFor } from './membership';
import { clearPendingInvite } from './pending-invite';
import type { Membership, TenancySource } from './membership';
import { TenancyContext } from './tenancy-context';
import type { TenancyContextValue, TenancyStatus } from './tenancy-context';

interface TenancyProviderProps {
  children: ReactNode;
  /** Solo para tests: espacios falsos, sin Supabase. */
  source?: TenancySource;
}

const NO_MEMBERSHIPS: readonly Membership[] = [];

export const MEMBERSHIPS_QUERY_KEY = ['tenancy', 'memberships'] as const;

/**
 * Tenant activo y rol del usuario, sacados de la sesión y de la base de datos
 * (DECISIONES D-048 y D-056). Al volver a la app se piden de nuevo los espacios:
 * si el coach ha dado de baja al usuario, la app lo nota sola (D-061).
 */
export function TenancyProvider({ children, source }: TenancyProviderProps) {
  const { status, user, signedOutReason } = useAuth();
  const queryClient = useQueryClient();
  const [tenancySource] = useState(() => source ?? createSupabaseTenancySource());
  const [preferred, setPreferred] = useState<{ userId: string; tenantId: string } | null>(null);
  const userId = status === 'signed-in' && user !== null ? user.id : null;

  const query = useQuery({
    queryKey: [...MEMBERSHIPS_QUERY_KEY, userId],
    queryFn: () => tenancySource.listMemberships(userId ?? ''),
    enabled: userId !== null,
    refetchOnWindowFocus: true,
  });

  // Al cerrar sesión no se queda en memoria nada del usuario anterior. Si la
  // cerró él mismo, tampoco el código que estaba a medias: en un dispositivo
  // compartido, otra persona no debe acabar unida a ese coach (D-037).
  useEffect(() => {
    if (status === 'signed-out') {
      queryClient.clear();
    }
    if (status === 'signed-out' && signedOutReason === 'explicit') {
      clearPendingInvite();
    }
  }, [status, signedOutReason, queryClient]);

  const refetch = query.refetch;
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const selectTenant = useCallback(
    (tenantId: string) => {
      if (userId !== null) {
        setPreferred({ userId, tenantId });
      }
    },
    [userId],
  );

  const memberships = query.data ?? NO_MEMBERSHIPS;
  const preferredTenantId =
    preferred !== null && preferred.userId === userId ? preferred.tenantId : null;

  let tenancyStatus: TenancyStatus = 'ready';
  if (status === 'loading' || (userId !== null && query.isPending)) {
    tenancyStatus = 'loading';
  } else if (userId !== null && query.isError) {
    tenancyStatus = 'error';
  }

  const value = useMemo<TenancyContextValue>(
    () => ({
      tenancy: tenancyFor(
        userId === null ? null : pickActiveMembership(memberships, preferredTenantId),
      ),
      memberships: userId === null ? NO_MEMBERSHIPS : memberships,
      status: tenancyStatus,
      selectTenant,
      refresh,
      source: tenancySource,
    }),
    [userId, memberships, preferredTenantId, tenancyStatus, selectTenant, refresh, tenancySource],
  );

  // Nunca se ocultan las pantallas mientras carga: una pantalla a medias (por
  // ejemplo, la de escribir un código del email) perdería lo escrito. Espera
  // quien necesita saber el espacio (las guardas, con `WhenTenancyReady`).
  return <TenancyContext value={value}>{children}</TenancyContext>;
}
