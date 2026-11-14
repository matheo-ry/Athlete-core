import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  BrandInput,
  LogoChange,
  MemberActionResult,
  SaveLogoResult,
  UpdateBrandResult,
} from './membership';
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

const LOGO_FAILURES: Record<Exclude<SaveLogoResult['status'], 'ok'>, UpdateBrandResult> = {
  too_large: 'logo_too_large',
  invalid_type: 'logo_invalid_type',
  not_allowed: 'not_allowed',
  offline: 'offline',
  error: 'error',
};

/**
 * Guardar la marca del negocio activo (D-057): nombre, colores, modo y logo.
 * Primero el logo: si el archivo no se puede subir, no cambia nada. Después se
 * vuelven a pedir los espacios, para que la marca nueva se vea al momento en
 * toda la app del coach, y se borra el archivo del logo anterior. Sin conexión
 * no se intenta.
 */
export function useUpdateBrand() {
  const { source, refresh, tenancy } = useTenancyContext();
  const tenantId = tenancy.tenant?.id ?? '';
  const currentLogo = tenancy.tenant?.branding.logoPath ?? null;
  return useMutation<UpdateBrandResult, Error, { brand: BrandInput; logo: LogoChange }>({
    mutationFn: async ({ brand, logo }) => {
      if (!navigator.onLine) {
        return 'offline';
      }
      if (logo.kind === 'replace') {
        const saved = await source.saveLogo(tenantId, logo.file);
        if (saved.status !== 'ok') {
          return LOGO_FAILURES[saved.status];
        }
      }
      if (logo.kind === 'remove' && currentLogo !== null) {
        const removed = await source.removeLogo(tenantId);
        if (removed !== 'ok') {
          return removed;
        }
      }
      const result = await source.updateBrand(tenantId, brand);
      // Aunque falle, el logo puede haber cambiado ya: se piden los espacios igual.
      await refresh();
      if (logo.kind !== 'keep' && currentLogo !== null) {
        await source.deleteLogoFile(currentLogo);
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
