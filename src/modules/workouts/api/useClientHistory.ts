import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/core/auth';
import { getDeviceId, getUploadQueue, useUploadQueue } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { fetchClientHistoryWorkouts, fetchCurrentClientProgramId } from './client-workouts-api';
import { buildCorrectionSyncPayload, type ClientWorkoutRecord } from '../model/workout-correction';

export function clientHistoryQueryKey(tenantId: string | null, clientId: string | null) {
  return ['workouts', 'client-history', tenantId, clientId] as const;
}

export function currentProgramQueryKey(tenantId: string | null, clientId: string | null) {
  return ['workouts', 'client-current-program', tenantId, clientId] as const;
}

/**
 * Entrenos cerrados del cliente (del más nuevo al más viejo) y rutina vigente.
 */
export function useClientHistory() {
  const { user } = useAuth();
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;
  const clientId = user?.id ?? null;

  const workoutsQuery = useQuery({
    queryKey: clientHistoryQueryKey(tenantId, clientId),
    queryFn: () => fetchClientHistoryWorkouts(tenantId ?? '', clientId ?? ''),
    enabled: tenantId !== null && clientId !== null,
  });

  const currentProgramQuery = useQuery({
    queryKey: currentProgramQueryKey(tenantId, clientId),
    queryFn: () => fetchCurrentClientProgramId(tenantId ?? '', clientId ?? ''),
    enabled: tenantId !== null && clientId !== null,
  });

  const uploadItems = useUploadQueue(clientId);
  const pendingUploadIds = useMemo(() => {
    const set = new Set<string>();
    for (const item of uploadItems) {
      if (item.kind === 'workout' && item.status === 'pending') {
        set.add(item.id);
      }
    }
    return set;
  }, [uploadItems]);

  const isPending = workoutsQuery.isPending || currentProgramQuery.isPending;
  const isError = workoutsQuery.isError || currentProgramQuery.isError;

  const refetch = async () => {
    await Promise.all([workoutsQuery.refetch(), currentProgramQuery.refetch()]);
  };

  return {
    workouts: workoutsQuery.data ?? [],
    currentProgramId: currentProgramQuery.data ?? null,
    pendingUploadIds,
    isPending,
    isError,
    refetch,
  };
}

/**
 * Permite al cliente corregir un entreno cerrado (D-124).
 * Se actualiza la caché local, se marca "Editado" y se encola para subir.
 */
export function useCorrectWorkout() {
  const { user } = useAuth();
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;
  const clientId = user?.id ?? null;

  return useMutation({
    mutationFn: async (corrected: ClientWorkoutRecord) => {
      if (tenantId === null || clientId === null) {
        return;
      }
      const now = new Date().toISOString();
      const updated: ClientWorkoutRecord = {
        ...corrected,
        edited_at: now,
        last_changed_at: now,
      };

      // Actualización optimista de la lista para mostrar "Editado" al instante
      queryClient.setQueryData(
        clientHistoryQueryKey(tenantId, clientId),
        (old: ClientWorkoutRecord[] | undefined) =>
          old ? old.map((w) => (w.id === updated.id ? updated : w)) : [updated],
      );

      const deviceId = await getDeviceId();
      const payload = buildCorrectionSyncPayload(updated, deviceId, now);

      await getUploadQueue().enqueue(clientId, {
        id: updated.id,
        kind: 'workout',
        tenantId,
        tenantName: tenant?.name ?? '',
        payload,
      });
    },
  });
}
