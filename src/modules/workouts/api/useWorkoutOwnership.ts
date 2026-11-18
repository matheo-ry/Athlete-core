import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from '@/core/auth';
import { getDeviceId, useUploadQueue } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { FREE, ownershipOf } from '../model/workout-handover';
import type { Ownership } from '../model/workout-handover';
import { fetchOpenWorkouts } from './remote-workout-api';
import { DEVICE_ONLY, useActiveWorkout } from './useActiveWorkout';

function openWorkoutsKey(userId: string, tenantId: string) {
  return ['workouts', 'open-remote', userId, tenantId] as const;
}

function useOpenWorkouts() {
  const { user } = useAuth();
  const { tenant, role } = useTenancy();
  const userId = user?.id ?? '';
  const tenantId = tenant?.id ?? '';
  return useQuery({
    queryKey: openWorkoutsKey(userId, tenantId),
    queryFn: () => fetchOpenWorkouts(tenantId, userId),
    enabled: userId !== '' && tenantId !== '' && role === 'client',
    // Lo cambia otro móvil: se mira cada vez que se entra o se vuelve.
    staleTime: 0,
  });
}

/** Vuelve a mirar en la nube, al volver a la app. */
export function useRefreshOpenWorkouts(): () => void {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { tenant } = useTenancy();
  const userId = user?.id ?? '';
  const tenantId = tenant?.id ?? '';
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: openWorkoutsKey(userId, tenantId) });
  }, [queryClient, userId, tenantId]);
}

/**
 * Si el entreno está en este móvil o en otro (D-124). Sin conexión, o mientras
 * no se sabe, no molesta: se entrena con lo que hay aquí.
 */
export function useWorkoutOwnership(): Ownership {
  const { user } = useAuth();
  const active = useActiveWorkout();
  const remote = useOpenWorkouts();
  const queue = useUploadQueue(user?.id ?? null);
  const device = useQuery({
    queryKey: ['workouts', 'device-id'],
    queryFn: getDeviceId,
    staleTime: Infinity,
    networkMode: DEVICE_ONLY,
  });
  if (!active.isSuccess || remote.data === undefined || device.data === undefined) {
    return FREE;
  }
  return ownershipOf(
    active.data,
    remote.data,
    device.data,
    new Set(queue.map((item) => item.id)),
    // La hora de la consulta: lo de las 12 horas se decide con lo que se leyó.
    remote.dataUpdatedAt,
  );
}

/** Los entrenos abiertos en la nube, ya cargados; `null` si aún no se sabe. */
export function useKnownOpenWorkoutIds(): ReadonlySet<string> | null {
  const remote = useOpenWorkouts();
  return remote.isSuccess && !remote.isFetching
    ? new Set(remote.data.map((item) => item.id))
    : null;
}
