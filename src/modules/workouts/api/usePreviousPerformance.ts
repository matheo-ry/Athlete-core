import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/core/auth';
import { useTenancy } from '@/core/tenancy';

import { previousFor } from '../model/offline-snapshot';
import type { PreviousPerformance } from '../model/offline-snapshot';
import { readOfflineSnapshot, snapshotQueryKey } from './offline-snapshot-api';

/**
 * Lo de la vez anterior de un ejercicio (D-120), de lo guardado en el teléfono:
 * mismo día de la rutina o, si no, cualquiera. `null` si nunca lo hizo.
 */
export function usePreviousPerformance(
  exerciseId: string,
  dayNumber: number,
): PreviousPerformance | null {
  const { user } = useAuth();
  const { tenant } = useTenancy();
  const userId = user?.id ?? '';
  const tenantId = tenant?.id ?? '';
  const snapshot = useQuery({
    queryKey: snapshotQueryKey(userId, tenantId),
    queryFn: () => readOfflineSnapshot(userId, tenantId),
    enabled: userId !== '' && tenantId !== '',
    staleTime: Infinity,
  });
  return snapshot.data ? previousFor(snapshot.data, exerciseId, dayNumber) : null;
}
