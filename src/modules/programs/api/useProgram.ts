import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import type { ProgramDocument } from '../model/program-document';
import { fetchProgram, saveProgram } from './programs-api';
import type { SaveProgramResult } from './programs-api';
import { templatesQueryKey } from './useTemplates';

export function programQueryKey(tenantId: string | null, programId: string) {
  return ['programs', 'document', tenantId, programId] as const;
}

/** Una rutina entera, para el editor. Sin volver a pedirla al volver a la pestaña: el editor tiene cambios a medias. */
export function useProgram(programId: string) {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: programQueryKey(tenantId, programId),
    queryFn: () => fetchProgram(tenantId ?? '', programId),
    // Sin rutina elegida todavía (el desplegable de plantillas vacío), no se pide.
    enabled: tenantId !== null && programId !== '',
    refetchOnWindowFocus: false,
  });
}

export type SaveResult = SaveProgramResult | { status: 'offline' };

/**
 * "Guardar cambios" (D-079): la rutina entera de una vez. Al guardar se vuelve
 * a pedir: así lo nuevo trae ya su identificador y el editor parte de lo que
 * hay en la base de datos.
 */
export function useSaveProgram(programId: string) {
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;

  return useMutation<SaveResult, Error, ProgramDocument>({
    mutationFn: async (document) => {
      if (!navigator.onLine) {
        return { status: 'offline' };
      }
      if (tenantId === null) {
        return { status: 'error' };
      }
      return saveProgram(tenantId, document);
    },
    onSuccess: async (result) => {
      if (result.status !== 'saved') {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: programQueryKey(tenantId, programId) }),
        queryClient.invalidateQueries({ queryKey: templatesQueryKey(tenantId) }),
      ]);
    },
  });
}
