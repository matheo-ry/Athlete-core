import type { ReactNode } from 'react';

import { ErrorState, Spinner } from '../ui';
import { useTenancyContext } from './useTenancy';

interface WhenTenancyReadyProps {
  children: ReactNode;
}

/**
 * Espera a saber los espacios del usuario: mientras cargan, un indicador; si
 * fallan, un error con "Reintentar" (los 4 estados de AGENTS.md §4).
 */
export function WhenTenancyReady({ children }: WhenTenancyReadyProps) {
  const { status, refresh } = useTenancyContext();

  if (status === 'loading') {
    return <Spinner className="min-h-dvh" />;
  }
  if (status === 'error') {
    return <ErrorState className="min-h-dvh justify-center" onRetry={() => void refresh()} />;
  }
  return children;
}
