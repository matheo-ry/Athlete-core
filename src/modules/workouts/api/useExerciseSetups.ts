import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/core/auth';
import { getUploadQueue } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import {
  fetchMySetups,
  readOfflineSetups,
  saveClientSetup,
  writeOfflineSetups,
} from './setups-api';
import type { SetupsMap } from './setups-api';

export function exerciseSetupsQueryKey(userId: string, tenantId: string) {
  return ['workouts', 'setups', userId, tenantId] as const;
}

/**
 * Set-ups del cliente para cada ejercicio (D-122).
 * Compartidos entre todas las rutinas. Se guardan en el teléfono para funcionar sin conexión.
 */
export function useExerciseSetups() {
  const { user } = useAuth();
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';
  const tenantId = tenant?.id ?? '';
  const tenantName = tenant?.name ?? '';

  const query = useQuery({
    queryKey: exerciseSetupsQueryKey(userId, tenantId),
    queryFn: async (): Promise<SetupsMap> => {
      if (!userId || !tenantId) {
        return {};
      }
      const cached = await readOfflineSetups(userId, tenantId);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const remote = await fetchMySetups(tenantId, userId);
          const merged = { ...cached, ...remote };
          await writeOfflineSetups(userId, tenantId, merged);
          return merged;
        } catch {
          return cached;
        }
      }
      return cached;
    },
    enabled: Boolean(userId && tenantId),
    networkMode: 'always',
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    networkMode: 'always',
    mutationFn: async ({ exerciseId, setup }: { exerciseId: string; setup: string }) => {
      if (!userId || !tenantId) {
        return;
      }
      const current =
        queryClient.getQueryData<SetupsMap>(exerciseSetupsQueryKey(userId, tenantId)) ?? {};
      const next = { ...current, [exerciseId]: setup.trim() };

      // 1. Guardar en el dispositivo al instante
      await writeOfflineSetups(userId, tenantId, next);
      queryClient.setQueryData(exerciseSetupsQueryKey(userId, tenantId), next);

      // 2. Encolar para subir
      await getUploadQueue().enqueue(userId, {
        id: `setup:${tenantId}:${exerciseId}`,
        kind: 'setup',
        tenantId,
        tenantName,
        payload: { exerciseId, setup: setup.trim() },
      });

      // 3. Si hay red, intentar subir al momento
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await saveClientSetup(tenantId, userId, exerciseId, setup);
        } catch {
          // La cola de subida se encargará
        }
      }
    },
  });

  return {
    setups: query.data ?? {},
    getSetup: (exerciseId: string): string => (query.data ?? {})[exerciseId] ?? '',
    saveSetup: (exerciseId: string, setup: string) =>
      saveMutation.mutateAsync({ exerciseId, setup }),
    isPending: query.isPending,
  };
}
