import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '../auth';
import { clearDeviceDrafts } from '../lib';
import { createSupabaseTenancySource } from './api/supabase-tenancy-source';
import {
  activeMemberships,
  homePathFor,
  needsSpaceChoice,
  pickActiveMembership,
  tenancyFor,
} from './membership';
import { clearCoachIntent } from './coach-intent';
import { clearLastSpace, rememberLastSpace, useLastSpace } from './last-space';
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
 * (DECISIONES D-048 y D-056). Con varios espacios se entra en el último usado
 * en este dispositivo o, si no hay, se elige en el selector (D-066). Al volver a
 * la app se piden de nuevo los espacios: si el coach ha dado de baja al
 * usuario, la app lo nota sola (D-061).
 */
export function TenancyProvider({ children, source }: TenancyProviderProps) {
  const { status, user, signedOutReason } = useAuth();
  const queryClient = useQueryClient();
  const [tenancySource] = useState(() => source ?? createSupabaseTenancySource());
  const userId = status === 'signed-in' && user !== null ? user.id : null;
  const preferredTenantId = useLastSpace(userId);

  const query = useQuery({
    queryKey: [...MEMBERSHIPS_QUERY_KEY, userId],
    queryFn: () => tenancySource.listMemberships(userId ?? ''),
    enabled: userId !== null,
    // Siempre que se vuelve a la app, aunque se pidieran hace nada: así un
    // cliente dado de baja con la app abierta lo nota al momento (D-061).
    refetchOnWindowFocus: 'always',
  });

  // Al cerrar sesión no se queda en memoria nada del usuario anterior. Si la
  // cerró él mismo, tampoco el código que estaba a medias (en un dispositivo
  // compartido, otra persona no debe acabar unida a ese coach, D-037) ni el
  // último espacio: al volver a entrar se elige otra vez (D-066). Ni lo que
  // dejó a medias en el editor de rutinas (D-079 y D-099).
  useEffect(() => {
    if (status === 'signed-out') {
      queryClient.clear();
    }
    if (status === 'signed-out' && signedOutReason === 'explicit') {
      clearPendingInvite();
      clearCoachIntent();
      clearLastSpace();
      clearDeviceDrafts();
    }
  }, [status, signedOutReason, queryClient]);

  const refetch = query.refetch;
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Un espacio recién creado o al que se acaba de unir todavía no está en la
  // lista: hasta que llega la lista nueva, las guardas esperan. Si no, la app
  // pasaría un momento por la bienvenida antes de entrar.
  const [awaiting, setAwaiting] = useState<{
    userId: string;
    tenantId: string;
    listFrom: number;
  } | null>(null);

  const selectTenant = useCallback(
    (tenantId: string) => {
      if (userId === null) {
        return;
      }
      rememberLastSpace(userId, tenantId);
      const current = queryClient.getQueryState<Membership[]>([...MEMBERSHIPS_QUERY_KEY, userId]);
      const known = activeMemberships(current?.data ?? []).some(
        (membership) => membership.tenantId === tenantId,
      );
      setAwaiting(known ? null : { userId, tenantId, listFrom: current?.dataUpdatedAt ?? 0 });
    },
    [userId, queryClient],
  );

  const memberships = userId === null ? NO_MEMBERSHIPS : (query.data ?? NO_MEMBERSHIPS);
  const waitingForNewSpace =
    awaiting !== null &&
    awaiting.userId === userId &&
    query.dataUpdatedAt === awaiting.listFrom &&
    !activeMemberships(memberships).some((membership) => membership.tenantId === awaiting.tenantId);

  let tenancyStatus: TenancyStatus = 'ready';
  if (userId !== null && query.isError) {
    tenancyStatus = 'error';
  } else if (status === 'loading' || (userId !== null && query.isPending) || waitingForNewSpace) {
    tenancyStatus = 'loading';
  }

  const value = useMemo<TenancyContextValue>(() => {
    const tenancy = tenancyFor(pickActiveMembership(memberships, preferredTenantId));
    return {
      tenancy,
      memberships,
      status: tenancyStatus,
      homePath: homePathFor(tenancy, needsSpaceChoice(memberships, preferredTenantId)),
      selectTenant,
      refresh,
      source: tenancySource,
    };
  }, [memberships, preferredTenantId, tenancyStatus, selectTenant, refresh, tenancySource]);

  // Nunca se ocultan las pantallas mientras carga: una pantalla a medias (por
  // ejemplo, la de escribir un código del email) perdería lo escrito. Espera
  // quien necesita saber el espacio (las guardas, con `WhenTenancyReady`).
  return <TenancyContext value={value}>{children}</TenancyContext>;
}
