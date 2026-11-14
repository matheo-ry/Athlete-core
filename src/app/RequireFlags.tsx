import { Outlet } from 'react-router';

import { useFeatureFlags } from '@/core/flags';
import { ErrorState, Spinner } from '@/core/ui';

/**
 * Las zonas de coach y de cliente esperan a saber qué funciones tiene el
 * negocio: así el menú no aparece a medias. Si fallan, error con "Reintentar".
 */
export function RequireFlags() {
  const { status, retry } = useFeatureFlags();

  if (status === 'loading') {
    return <Spinner className="min-h-dvh" />;
  }
  if (status === 'error') {
    return <ErrorState className="min-h-dvh justify-center" onRetry={retry} />;
  }
  return <Outlet />;
}
