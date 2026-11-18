import type { ClientProfileTabProps } from '@/core/modules';

import { useClientProgress } from '../api/useClientProgress';
import { ProgressView } from '../shared/ProgressView';

/**
 * Pestaña "Progreso" en la ficha del cliente (vista del coach, D-129, D-131).
 * El coach ve lo mismo que el cliente en /client/progress y puede descargar en Excel (Criterio 2).
 */
export function ClientProgressTab({ clientId, clientName }: ClientProfileTabProps) {
  const { groups, rawWorkouts, exerciseOptionsById, isPending, isError, refetch, unit } =
    useClientProgress(clientId);

  return (
    <ProgressView
      clientId={clientId}
      clientName={clientName}
      groups={groups}
      rawWorkouts={rawWorkouts}
      exerciseOptionsById={exerciseOptionsById}
      isPending={isPending}
      isError={isError}
      onRetry={() => void refetch()}
      unit={unit}
      isCoach={true}
    />
  );
}
