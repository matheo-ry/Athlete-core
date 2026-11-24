import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/core/auth';
import { logger } from '@/core/lib';
import { getDeviceId, getDeviceStore, getUploadQueue, userKey } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { activeWorkoutSchema, setCounts, toSyncPayload } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { withSides } from '../model/exercise-actions';
import { discardPayload } from './sync-workout-api';

// El entreno abierto vive en el almacén del teléfono, uno por usuario y
// espacio (D-119: un solo entreno abierto a la vez). Cada cambio se guarda al
// instante y se encola para subirlo (D-118, D-143); la cola sustituye la
// versión anterior del mismo entreno.

function activeKey(userId: string, tenantId: string): string {
  return userKey(userId, `workouts.active.${tenantId}`);
}

/**
 * Todo esto va al almacén del teléfono, no a la red: tiene que funcionar sin
 * conexión. Con el modo por defecto, TanStack Query lo deja en pausa mientras
 * no hay red, y lo apuntado sin cobertura no se guardaba (D-149).
 */
export const DEVICE_ONLY = 'always' as const;

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

function finishedQueryKey(workoutId: string) {
  return ['workouts', 'finished', workoutId] as const;
}

/**
 * El entreno recién cerrado, para su resumen final (D-149). Solo vive en
 * memoria: es la pantalla de justo después de cerrarlo.
 */
export function useFinishedWorkout(workoutId: string | null) {
  return useQuery<ActiveWorkout | null>({
    queryKey: finishedQueryKey(workoutId ?? ''),
    queryFn: () => null,
    enabled: workoutId !== null,
    staleTime: Infinity,
    networkMode: DEVICE_ONLY,
  });
}

/** El entreno abierto en este espacio; `null` si no hay ninguno. */
export function useActiveWorkout() {
  const scope = useScope();
  return useQuery({
    queryKey: activeQueryKey(scope?.userId ?? '', scope?.tenantId ?? ''),
    queryFn: async () => {
      if (scope === null) {
        return null;
      }
      const stored = await getDeviceStore().read(
        activeKey(scope.userId, scope.tenantId),
        activeWorkoutSchema,
      );
      // Un unilateral guardado antes del PR 3.8 no traía lados (D-121).
      return stored === null ? null : withSides(stored, () => crypto.randomUUID());
    },
    enabled: scope !== null,
    networkMode: DEVICE_ONLY,
    // Lo guardado en el teléfono no cambia por su cuenta: solo lo cambia esta pantalla.
    staleTime: Infinity,
  });
}

/** Guarda el entreno en el teléfono, lo pinta al momento y lo encola para subirlo. */
export function useSaveActiveWorkout() {
  const scope = useScope();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: DEVICE_ONLY,
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
      const empty = closed && setCounts(workout.exercises).done === 0;
      if (closed) {
        await getDeviceStore().remove(key);
        if (!empty) {
          queryClient.setQueryData(finishedQueryKey(workout.id), workout);
        }
      } else if (!(await getDeviceStore().write(key, workout))) {
        logger.error('Could not save the open workout on the device');
      }
      await getUploadQueue().enqueue(scope.userId, {
        id: workout.id,
        kind: 'workout',
        tenantId: scope.tenantId,
        tenantName: scope.tenantName,
        // Sin ninguna serie hecha no se guarda (D-119): al empezar ya subió, y
        // si no se borra se queda abierto en la nube para siempre (D-151).
        payload: empty ? discardPayload(workout.id) : toSyncPayload(workout, await getDeviceId()),
      });
    },
  });
}

/** Lo quita de este móvil sin subir nada: se cerró o se descartó en otro (D-152). */
export function useForgetActiveWorkout() {
  const scope = useScope();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: DEVICE_ONLY,
    mutationFn: async () => {
      if (scope !== null) {
        queryClient.setQueryData(activeQueryKey(scope.userId, scope.tenantId), null);
        await getDeviceStore().remove(activeKey(scope.userId, scope.tenantId));
      }
    },
  });
}

/**
 * "Descartar entreno" (D-119): lo quita del teléfono y encola
 * `discard_workout`, que sustituye a la subida pendiente (D-149).
 */
export function useDiscardActiveWorkout() {
  const scope = useScope();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: DEVICE_ONLY,
    mutationFn: async (workout: ActiveWorkout) => {
      if (scope === null) {
        return;
      }
      queryClient.setQueryData(activeQueryKey(scope.userId, scope.tenantId), null);
      await getDeviceStore().remove(activeKey(scope.userId, scope.tenantId));
      await getUploadQueue().enqueue(scope.userId, {
        id: workout.id,
        kind: 'workout',
        tenantId: scope.tenantId,
        tenantName: scope.tenantName,
        payload: discardPayload(workout.id),
      });
    },
  });
}
