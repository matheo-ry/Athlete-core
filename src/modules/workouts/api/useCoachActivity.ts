import { useQuery } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import { fetchCoachActivityWorkouts } from './workouts-api';

export function coachActivityQueryKey(tenantId: string | null) {
  return ['workouts', 'coach-activity', tenantId] as const;
}

/** Entrenos recientes de los clientes del negocio para la tarjeta de actividad del coach. */
export function useCoachActivity() {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: coachActivityQueryKey(tenantId),
    queryFn: () => fetchCoachActivityWorkouts(tenantId ?? ''),
    enabled: tenantId !== null,
  });
}
