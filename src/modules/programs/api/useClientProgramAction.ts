import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import { localToday } from '../model/calendar';
import { runClientProgramAction } from './client-program-api';
import type { ClientProgramAction, ClientProgramActionResult } from './client-program-api';
import { clientProgramsQueryKey } from './useAssignments';
import { templatesQueryKey } from './useTemplates';

/**
 * Crear desde cero, terminar, cancelar, reiniciar o guardar como plantilla la
 * rutina de un cliente. Sin conexión no se intenta (D-061). Después se vuelven
 * a pedir las rutinas de los clientes y las plantillas.
 */
export function useClientProgramAction() {
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;

  return useMutation<ClientProgramActionResult | { status: 'offline' }, Error, ClientProgramAction>(
    {
      mutationFn: async (action) => {
        if (!navigator.onLine) {
          return { status: 'offline' };
        }
        if (tenantId === null) {
          return { status: 'error' };
        }
        return runClientProgramAction(tenantId, action, localToday());
      },
      onSuccess: async (result) => {
        if (result.status !== 'done') {
          return;
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: clientProgramsQueryKey(tenantId) }),
          queryClient.invalidateQueries({ queryKey: templatesQueryKey(tenantId) }),
        ]);
      },
    },
  );
}
