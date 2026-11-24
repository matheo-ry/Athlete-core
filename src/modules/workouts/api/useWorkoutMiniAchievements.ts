import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/core/auth';
import { useTenancy, useTenantSettings } from '@/core/tenancy';

import type { ActiveWorkout } from '../model/active-workout';
import { countWorkoutMiniAchievements } from '../model/minilogros';
import { readOfflineSnapshot, snapshotQueryKey } from './offline-snapshot-api';
import { DEVICE_ONLY } from './useActiveWorkout';

/**
 * Cuenta los minilogros del entreno actual comparando con la vez anterior (D-130).
 * Si el coach ha desactivado los logros, devuelve 0.
 */
export function useWorkoutMiniAchievements(workout: ActiveWorkout): number {
  const { achievementsEnabled } = useTenantSettings();
  const { user } = useAuth();
  const { tenant } = useTenancy();
  const userId = user?.id ?? '';
  const tenantId = tenant?.id ?? '';
  const snapshot = useQuery({
    queryKey: snapshotQueryKey(userId, tenantId),
    queryFn: () => readOfflineSnapshot(userId, tenantId),
    enabled: achievementsEnabled && userId !== '' && tenantId !== '',
    staleTime: Infinity,
    networkMode: DEVICE_ONLY,
  });

  if (!achievementsEnabled) {
    return 0;
  }
  return countWorkoutMiniAchievements(workout, snapshot.data ?? null);
}
