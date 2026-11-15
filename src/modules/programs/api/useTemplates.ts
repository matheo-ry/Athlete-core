import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTenancy } from '@/core/tenancy';

import { copyOfProgram } from '../model/copy';
import { newTemplate } from '../model/program-document';
import { fetchProgram, fetchTemplates, saveProgram, setTemplateArchived } from './programs-api';

export function templatesQueryKey(tenantId: string | null) {
  return ['programs', 'templates', tenantId] as const;
}

/** Las plantillas del negocio activo. El tenant va en la clave: al cambiar de espacio no se reutiliza la caché. */
export function useTemplates() {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;

  return useQuery({
    queryKey: templatesQueryKey(tenantId),
    queryFn: () => fetchTemplates(tenantId ?? ''),
    enabled: tenantId !== null,
  });
}

type TemplateAction =
  | { kind: 'create'; name: string; cycleDays: number }
  | { kind: 'rename'; id: string; name: string }
  /** Una plantilla nueva igual que esta, con ese nombre (PR 2.11). */
  | { kind: 'duplicate'; id: string; name: string }
  | { kind: 'archive'; id: string; archived: boolean };

export type TemplateActionResult =
  | { status: 'saved'; id: string }
  | { status: 'offline' | 'conflict' | 'limit_reached' | 'archived_exercise' | 'error' };

/**
 * Crear, renombrar, archivar o recuperar una plantilla (D-061: sin conexión
 * no se intenta). Renombrar carga la rutina entera y la guarda con el nombre
 * nuevo: save_program es la única forma de cambiarla (D-096). Después la
 * lista se vuelve a pedir.
 */
export function useTemplateAction() {
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;

  return useMutation<TemplateActionResult, Error, TemplateAction>({
    mutationFn: async (action) => {
      if (!navigator.onLine) {
        return { status: 'offline' };
      }
      if (tenantId === null) {
        return { status: 'error' };
      }
      if (action.kind === 'archive') {
        const { status } = await setTemplateArchived(tenantId, action.id, action.archived);
        return status === 'saved' ? { status, id: action.id } : { status };
      }
      const document =
        action.kind === 'create'
          ? newTemplate(action.name, action.cycleDays)
          : action.kind === 'duplicate'
            ? copyOfProgram(await fetchProgram(tenantId, action.id), action.name)
            : { ...(await fetchProgram(tenantId, action.id)), name: action.name };
      const result = await saveProgram(tenantId, document);
      return result.status === 'saved'
        ? { status: 'saved', id: result.id }
        : { status: result.status };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: templatesQueryKey(tenantId) }),
  });
}
