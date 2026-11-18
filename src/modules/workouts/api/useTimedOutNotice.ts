import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { useAuth } from '@/core/auth';
import { getDeviceStore, userKey } from '@/core/native';
import { useTenancy } from '@/core/tenancy';

import { DEVICE_ONLY } from './useActiveWorkout';

// "Guardamos tu entreno del lunes" (D-119): se queda en el teléfono hasta que
// el cliente lo lee, aunque cierre la app antes de verlo.

const noticeSchema = z.object({ lastChangedAt: z.string() });

function useNoticeScope() {
  const { user } = useAuth();
  const { tenant } = useTenancy();
  const userId = user?.id ?? '';
  const tenantId = tenant?.id ?? '';
  return {
    enabled: userId !== '' && tenantId !== '',
    key: userKey(userId, `workouts.timed-out.${tenantId}`),
    queryKey: ['workouts', 'timed-out', userId, tenantId] as const,
  };
}

export function useTimedOutNotice() {
  const { enabled, key, queryKey } = useNoticeScope();
  return useQuery({
    queryKey,
    queryFn: () => getDeviceStore().read(key, noticeSchema),
    enabled,
    staleTime: Infinity,
    networkMode: DEVICE_ONLY,
  });
}

/** Guarda el aviso, o lo borra con `null` cuando ya se ha leído. */
export function useSetTimedOutNotice() {
  const { key, queryKey } = useNoticeScope();
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: DEVICE_ONLY,
    mutationFn: async (lastChangedAt: string | null) => {
      const notice = lastChangedAt === null ? null : { lastChangedAt };
      queryClient.setQueryData(queryKey, notice);
      if (notice === null) {
        await getDeviceStore().remove(key);
      } else {
        await getDeviceStore().write(key, notice);
      }
    },
  });
}
