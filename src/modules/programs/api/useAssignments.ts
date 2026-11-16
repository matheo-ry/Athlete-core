import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import { assignProgram, fetchClientPrograms } from './assignments-api';
import type { AssignInput, AssignResult } from './assignments-api';

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
