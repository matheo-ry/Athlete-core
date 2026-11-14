import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useTenancy } from '../tenancy';
import { createSupabaseFlagsSource } from './api/supabase-flags-source';
import { flagsFor } from './feature-flags';
import { FlagsContext } from './flags-context';
import type { FlagsStatus } from './flags-context';
import type { FlagsSource } from './flags-source';

interface FlagsProviderProps {
  children: ReactNode;
  /** Solo para tests: flags falsos, sin Supabase. */
  source?: FlagsSource;
}

const NO_FEATURES: readonly string[] = [];

/**
 * Qué funciones están activas para el tenant actual, leídas de la base de datos
 * (ARQUITECTURA §9). Sin tenant no hay ninguna. Nunca oculta las pantallas
 * mientras carga: lo dice en `status`, y espera quien lo necesita (las zonas de
 * coach y de cliente). Recuerda: los flags son empaquetado de producto, NO seguridad.
 */
export function FlagsProvider({ children, source }: FlagsProviderProps) {
  const { tenant } = useTenancy();
  const [flagsSource] = useState(() => source ?? createSupabaseFlagsSource());
  const tenantId = tenant?.id ?? null;

  const query = useQuery({
    queryKey: ['flags', tenantId],
    queryFn: () => flagsSource.listEnabledFeatures(tenantId ?? ''),
    enabled: tenantId !== null,
  });

  let status: FlagsStatus = 'ready';
  if (tenantId !== null && query.isPending) {
    status = 'loading';
  } else if (tenantId !== null && query.isError) {
    status = 'error';
  }

  const keys = tenantId === null ? NO_FEATURES : (query.data ?? NO_FEATURES);
  const refetch = query.refetch;
  const value = useMemo(
    () => flagsFor(keys, status, () => void refetch()),
    [keys, status, refetch],
  );

  return <FlagsContext value={value}>{children}</FlagsContext>;
}
