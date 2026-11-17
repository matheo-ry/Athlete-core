import type { ClientProfileTabProps } from '@/core/modules';

import { useClientProgress } from '../api/useClientProgress';
import { ProgressView } from '../shared/ProgressView';

/**
 * Pestaña "Progreso" en la ficha del cliente (vista del coach, D-129).
 * El coach ve lo mismo que el cliente en /client/progress (Criterio 4).
 */
export function ClientProgressTab({ clientId }: ClientProfileTabProps) {
  const { groups, isPending, isError, refetch, unit } = useClientProgress(clientId);

  return (
    <ProgressView
      groups={groups}
      isPending={isPending}
      isError={isError}
      onRetry={() => void refetch()}
      unit={unit}
    />
  );
}
