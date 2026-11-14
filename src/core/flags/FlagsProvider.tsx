import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useTenancy } from '../tenancy';
import { ErrorState, Spinner } from '../ui';
import { createSupabaseFlagsSource } from './api/supabase-flags-source';
import { flagsFor } from './feature-flags';
import { FlagsContext } from './flags-context';
import type { FlagsSource } from './flags-source';

interface FlagsProviderProps {
  children: ReactNode;
  /** Solo para tests: flags falsos, sin Supabase. */
  source?: FlagsSource;
}

const NO_FEATURES: readonly string[] = [];

/**
 * Qué funciones están activas para el tenant actual, leídas de la base de datos
 * (ARQUITECTURA §9). Sin tenant no hay ninguna. Recuerda: los flags son
 * empaquetado de producto, NO seguridad.
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

  const keys = tenantId === null ? NO_FEATURES : (query.data ?? NO_FEATURES);
  const value = useMemo(() => flagsFor(keys), [keys]);

  if (tenantId !== null && query.isPending) {
    return <Spinner className="min-h-dvh" />;
  }
  if (tenantId !== null && query.isError) {
    return <ErrorState className="min-h-dvh justify-center" onRetry={() => void query.refetch()} />;
  }
  return <FlagsContext value={value}>{children}</FlagsContext>;
}
