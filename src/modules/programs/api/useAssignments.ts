import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import {
  assignProgram,
  fetchClientPrograms,
  fetchProgramsOfClient,
  setMissedDayRule,
} from './assignments-api';
import type { AssignInput, AssignResult } from './assignments-api';
import type { MissedDayRule } from '../model/calendar';

export function clientProgramsQueryKey(tenantId: string | null) {
  return ['programs', 'client-programs', tenantId] as const;
}

/** Las rutinas abiertas de los clientes del negocio activo. */
export function useClientPrograms() {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: clientProgramsQueryKey(tenantId),
    queryFn: () => fetchClientPrograms(tenantId ?? ''),
    enabled: tenantId !== null,
  });
}

export function programsOfClientQueryKey(tenantId: string | null, clientId: string) {
  return ['programs', 'client-programs', tenantId, clientId] as const;
}

/** Todas las rutinas de un cliente, para la pestaña "Rutina" de su ficha. */
export function useProgramsOfClient(clientId: string) {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: programsOfClientQueryKey(tenantId, clientId),
    queryFn: () => fetchProgramsOfClient(tenantId ?? '', clientId),
    enabled: tenantId !== null,
  });
}

/** "Asignar" (D-081). Sin conexión no se intenta (D-061). */
export function useAssignProgram() {
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;

  return useMutation<AssignResult | { status: 'offline' }, Error, AssignInput>({
    mutationFn: async (input) => {
      if (!navigator.onLine) {
        return { status: 'offline' };
      }
      if (tenantId === null) {
        return { status: 'error' };
      }
      return assignProgram(tenantId, input);
    },
    onSuccess: async (result) => {
      if (result.status === 'assigned') {
        await queryClient.invalidateQueries({ queryKey: clientProgramsQueryKey(tenantId) });
      }
    },
  });
}

/** Cambiar la regla del día saltado (D-125, D-139). */
export function useSetMissedDayRule(clientId?: string) {
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;

  return useMutation({
    mutationFn: async ({
      programId,
      rule,
      today,
    }: {
      programId: string;
      rule: MissedDayRule;
      today: string;
    }) => {
      if (!navigator.onLine) {
        return { status: 'offline' as const };
      }
      if (tenantId === null) {
        return { status: 'error' as const };
      }
      return setMissedDayRule(tenantId, programId, rule, today);
    },
    onSuccess: async (result) => {
      if (result.status === 'done') {
        await queryClient.invalidateQueries({ queryKey: clientProgramsQueryKey(tenantId) });
        if (clientId) {
          await queryClient.invalidateQueries({
            queryKey: programsOfClientQueryKey(tenantId, clientId),
          });
        }
      }
    },
  });
}
