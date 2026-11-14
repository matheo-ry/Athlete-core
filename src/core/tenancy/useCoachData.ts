import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BrandInput, MemberActionResult, UpdateBrandResult } from './membership';
import { useTenancyContext } from './useTenancy';

// Datos que solo ve el coach del negocio activo: sus miembros, su código de
// invitación y el límite de su plan. El tenant va en la clave de la caché: al
// cambiar de espacio no se reutilizan los datos del anterior.

function useActiveTenantId(): string | null {
  return useTenancyContext().tenancy.tenant?.id ?? null;
}

export function tenantMembersQueryKey(tenantId: string | null) {
  return ['tenancy', 'members', tenantId] as const;
}

/** Los miembros del negocio activo, con su nombre (D-059). */
export function useTenantMembers() {
  const { source } = useTenancyContext();
  const tenantId = useActiveTenantId();
  return useQuery({
    queryKey: tenantMembersQueryKey(tenantId),
    queryFn: () => source.listMembers(tenantId ?? ''),
    enabled: tenantId !== null,
  });
}

/** El código de invitación activo del negocio (D-050). */
export function useInviteCode() {
  const { source } = useTenancyContext();
  const tenantId = useActiveTenantId();
  return useQuery({
    queryKey: ['tenancy', 'invite-code', tenantId],
    queryFn: () => source.getInviteCode(tenantId ?? ''),
    enabled: tenantId !== null,
  });
}

/** Cambiar el código: el anterior y sus enlaces dejan de valer al instante (D-050). */
export function useRegenerateInviteCode() {
  const { source } = useTenancyContext();
  const tenantId = useActiveTenantId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => source.regenerateInviteCode(tenantId ?? ''),
    onSuccess: (code) => {
      queryClient.setQueryData(['tenancy', 'invite-code', tenantId], code);
    },
  });
}

/**
 * Dar de baja o reactivar a un cliente (D-055). Si sale bien, se vuelve a pedir
 * la lista de miembros. Sin conexión no se intenta.
 */
export function useClientStatusChange(action: 'archive' | 'reactivate') {
  const { source } = useTenancyContext();
  const tenantId = useActiveTenantId();
  const queryClient = useQueryClient();
  return useMutation<MemberActionResult, Error, string>({
    mutationFn: async (userId) => {
      if (!navigator.onLine) {
        return 'offline';
      }
      return action === 'archive'
        ? source.archiveClient(tenantId ?? '', userId)
        : source.reactivateClient(tenantId ?? '', userId);
    },
    onSuccess: async (result) => {
      if (result === 'ok') {
        await queryClient.invalidateQueries({ queryKey: tenantMembersQueryKey(tenantId) });
      }
    },
  });
}

/**
 * Guardar la marca del negocio activo (D-057). Si sale bien, se vuelven a pedir
 * los espacios: la marca nueva se ve al momento en toda la app del coach. Sin
 * conexión no se intenta.
 */
export function useUpdateBrand() {
  const { source, refresh } = useTenancyContext();
  const tenantId = useActiveTenantId();
  return useMutation<UpdateBrandResult, Error, BrandInput>({
    mutationFn: async (input) => {
      if (!navigator.onLine) {
        return 'offline';
      }
      const result = await source.updateBrand(tenantId ?? '', input);
      if (result === 'ok') {
        await refresh();
      }
      return result;
    },
  });
}

/** El plan del negocio y su límite de clientes (D-017). */
export function usePlanLimit() {
  const { source } = useTenancyContext();
  const tenantId = useActiveTenantId();
  return useQuery({
    queryKey: ['tenancy', 'plan', tenantId],
    queryFn: () => source.getPlanLimit(tenantId ?? ''),
    enabled: tenantId !== null,
  });
}
