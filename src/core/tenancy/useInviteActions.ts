import { useMutation } from '@tanstack/react-query';

import type { InvitePreview, JoinResult } from './invite';
import type { CreateBusinessResult } from './membership';
import { useTenancyContext } from './useTenancy';

/**
 * Crear el negocio (D-049). Si sale bien, se vuelven a pedir los espacios y el
 * negocio nuevo pasa a ser el activo.
 */
export function useCreateBusiness() {
  const { source, refresh, selectTenant } = useTenancyContext();
  return useMutation<CreateBusinessResult, Error, { name: string; coachTermsVersion: string }>({
    mutationFn: async ({ name, coachTermsVersion }) => {
      if (!navigator.onLine) {
        return { status: 'offline' };
      }
      const result = await source.createBusiness(name, coachTermsVersion);
      if (result.status === 'created') {
        selectTenant(result.tenantId);
        await refresh();
      }
      return result;
    },
  });
}

/** Ver a qué coach pertenece un código (D-051). Sin conexión no se intenta. */
export function useInvitePreview() {
  const { source } = useTenancyContext();
  return useMutation<InvitePreview, Error, string>({
    mutationFn: (code) =>
      navigator.onLine ? source.previewInvite(code) : Promise.resolve({ status: 'offline' }),
  });
}

/**
 * Unirse con el código (D-054). Si entra, se vuelven a pedir los espacios y el
 * nuevo pasa a ser el activo.
 */
export function useJoinWithCode() {
  const { source, refresh, selectTenant } = useTenancyContext();
  return useMutation<JoinResult, Error, string>({
    mutationFn: async (code) => {
      if (!navigator.onLine) {
        return { status: 'offline' };
      }
      const result = await source.joinWithCode(code);
      if ('tenantId' in result) {
        selectTenant(result.tenantId);
        await refresh();
      }
      return result;
    },
  });
}
