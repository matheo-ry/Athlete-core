import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/core/auth';
import { logger } from '@/core/lib';
import { getDeviceStore, getUploadQueue, userKey } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { activeWorkoutSchema, setCounts, toSyncPayload } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';

// El entreno abierto vive en el almacén del teléfono, uno por usuario y
// espacio (D-119: un solo entreno abierto a la vez). Cada cambio se guarda al
// instante y se encola para subirlo (D-118, D-143); la cola sustituye la
// versión anterior del mismo entreno.

function activeKey(userId: string, tenantId: string): string {
  return userKey(userId, `workouts.active.${tenantId}`);
}

function activeQueryKey(userId: string, tenantId: string) {
  return ['workouts', 'active', userId, tenantId] as const;
}

interface Scope {
  userId: string;
  tenantId: string;
  tenantName: string;
}

function useScope(): Scope | null {
  const { user } = useAuth();
  const { tenant } = useTenancy();
  return user === null || tenant === null
    ? null
    : { userId: user.id, tenantId: tenant.id, tenantName: tenant.name };
}

/** El entreno abierto en este espacio; `null` si no hay ninguno. */
export function useActiveWorkout() {
  const scope = useScope();
  return useQuery({
    queryKey: activeQueryKey(scope?.userId ?? '', scope?.tenantId ?? ''),
    queryFn: () =>
      scope === null
        ? null
        : getDeviceStore().read(activeKey(scope.userId, scope.tenantId), activeWorkoutSchema),
    enabled: scope !== null,
    // Lo guardado en el teléfono no cambia por su cuenta: solo lo cambia esta pantalla.
    staleTime: Infinity,
  });
}

/** Guarda el entreno en el teléfono, lo pinta al momento y lo encola para subirlo. */
export function useSaveActiveWorkout() {
  const scope = useScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: ActiveWorkout) => {
      if (scope === null) {
        return;
      }
      const key = activeKey(scope.userId, scope.tenantId);
      const closed = workout.closedAt !== null;
      // Cerrado ya no es el entreno abierto; sin ninguna serie hecha, no se guarda (D-119).
      queryClient.setQueryData(
        activeQueryKey(scope.userId, scope.tenantId),
        closed ? null : workout,
      );
      if (closed) {
        await getDeviceStore().remove(key);
        if (setCounts(workout.exercises).done === 0) {
          return;
        }
      } else if (!(await getDeviceStore().write(key, workout))) {
        logger.error('Could not save the open workout on the device');
      }
      await getUploadQueue().enqueue(scope.userId, {
        id: workout.id,
        kind: 'workout',
        tenantId: scope.tenantId,
        tenantName: scope.tenantName,
        payload: toSyncPayload(workout),
      });
    },
  });
}
