import { useQuery } from '@tanstack/react-query';

import { healthDataQueryKey, useTenancy } from '@/core/tenancy';

import {
  fetchClientHealthData,
  fetchClientMissedDays,
  fetchClientSetups,
  fetchClientWorkouts,
  fetchProgramDays,
} from './workouts-coach-api';

export function clientWorkoutsQueryKey(tenantId: string | null, clientId: string) {
  return ['workouts', 'coach-client-workouts', tenantId, clientId] as const;
}

export function clientHealthQueryKey(tenantId: string | null, clientId: string | null) {
  return healthDataQueryKey(tenantId, 'workouts', 'client-health', clientId);
}

export function clientSetupsQueryKey(tenantId: string | null, clientId: string) {
  return ['workouts', 'coach-client-setups', tenantId, clientId] as const;
}

export function tenantProgramDaysQueryKey(tenantId: string | null) {
  return ['workouts', 'tenant-program-days', tenantId] as const;
}

/** Entrenos y días faltados del cliente, para la pestaña del coach. */
export function useClientWorkouts(clientId: string) {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  const workoutsQuery = useQuery({
    queryKey: clientWorkoutsQueryKey(tenantId, clientId),
    queryFn: () => fetchClientWorkouts(tenantId ?? '', clientId),
    enabled: tenantId !== null,
  });

  const missedDaysQuery = useQuery({
    queryKey: ['workouts', 'coach-client-missed-days', tenantId, clientId],
    queryFn: () => fetchClientMissedDays(tenantId ?? '', clientId),
    enabled: tenantId !== null,
  });

  const programDaysQuery = useQuery({
    queryKey: tenantProgramDaysQueryKey(tenantId),
    queryFn: () => fetchProgramDays(tenantId ?? ''),
    enabled: tenantId !== null,
  });

  const setupsQuery = useQuery({
    queryKey: clientSetupsQueryKey(tenantId, clientId),
    queryFn: () => fetchClientSetups(tenantId ?? '', clientId),
    enabled: tenantId !== null,
  });

  const isPending =
    workoutsQuery.isPending ||
    missedDaysQuery.isPending ||
    programDaysQuery.isPending ||
    setupsQuery.isPending;

  const isError =
    workoutsQuery.isError ||
    missedDaysQuery.isError ||
    programDaysQuery.isError ||
    setupsQuery.isError;

  const refetch = async () => {
    await Promise.all([
      workoutsQuery.refetch(),
      missedDaysQuery.refetch(),
      programDaysQuery.refetch(),
      setupsQuery.refetch(),
    ]);
  };

  const setupsMap = new Map<string, string>();
  for (const s of setupsQuery.data ?? []) {
    setupsMap.set(s.exercise_id, s.setup);
  }

  const daysMap = new Map<string, string>();
  for (const d of programDaysQuery.data ?? []) {
    if (d.name) {
      daysMap.set(d.id, d.name);
    }
  }

  return {
    workouts: workoutsQuery.data ?? [],
    missedDays: missedDaysQuery.data ?? [],
    daysMap,
    setupsMap,
    isPending,
    isError,
    refetch,
  };
}

/**
 * Datos de salud del cliente (peso y medidas si dio el consentimiento).
 * También los usa `progress` por el index.ts (D-127): este módulo es el dueño.
 */
export function useClientHealthData(clientId: string | null) {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: clientHealthQueryKey(tenantId, clientId),
    queryFn: () => fetchClientHealthData(tenantId ?? '', clientId ?? ''),
    enabled: tenantId !== null && clientId !== null,
  });
}
