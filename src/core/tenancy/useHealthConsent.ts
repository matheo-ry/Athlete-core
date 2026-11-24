import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuth } from '../auth';
import { HEALTH_CONSENT_TEXT_VERSION, isHealthConsentGranted } from './health-consent';
import type { HealthConsentChange } from './health-consent';
import { useTenancyContext } from './useTenancy';

export function healthConsentQueryKey(tenantId: string | null, userId: string | null) {
  return ['tenancy', 'health-consent', tenantId, userId] as const;
}

/**
 * Raíz de las consultas con datos de salud (peso, medidas) de un espacio: los
 * módulos que las hacen cuelgan su clave de aquí. Así retirar el consentimiento
 * las borra de la caché (y del teléfono) sin que `core` conozca esos módulos.
 */
export function healthDataQueryKey(tenantId: string | null, ...rest: readonly unknown[]) {
  return ['health-data', tenantId, ...rest] as const;
}

/**
 * El consentimiento de datos de salud del usuario en el espacio activo (D-126).
 * Lo usan varios módulos: `workouts` para el lastre, las notas y el peso.
 *
 * Mirar aquí el consentimiento sirve para saber qué pantalla enseñar; la
 * protección real son las políticas de `body_weights`, `body_measurements` y
 * las notas, que sin consentimiento no dejan escribir.
 */
export function useHealthConsent() {
  const { tenancy, source } = useTenancyContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = tenancy.tenant?.id ?? null;
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: healthConsentQueryKey(tenantId, userId),
    queryFn: () => source.getHealthConsent(tenantId ?? '', userId ?? ''),
    // Es solo del cliente: el coach no da ni retira nada.
    enabled: tenantId !== null && userId !== null && tenancy.profile === 'client',
  });

  /** Da el consentimiento. Si sale bien, la caché ya lo sabe. */
  const grant = useCallback(async (): Promise<HealthConsentChange> => {
    if (tenantId === null) {
      return 'error';
    }
    const result = await source.grantHealthConsent(tenantId);
    if (result === 'ok') {
      queryClient.setQueryData(healthConsentQueryKey(tenantId, userId), {
        status: 'granted',
        grantedAt: new Date().toISOString(),
        textVersion: HEALTH_CONSENT_TEXT_VERSION,
      });
    }
    return result;
  }, [tenantId, userId, queryClient, source]);

  /** Lo retira. La base de datos borra peso, medidas y notas de ese espacio. */
  const withdraw = useCallback(async (): Promise<HealthConsentChange> => {
    if (tenantId === null) {
      return 'error';
    }
    const result = await source.withdrawHealthConsent(tenantId);
    if (result === 'ok') {
      // La base de datos ya los borró: que no quede nada en la caché ni en el teléfono.
      queryClient.removeQueries({ queryKey: healthDataQueryKey(tenantId) });
      queryClient.setQueryData(healthConsentQueryKey(tenantId, userId), {
        status: 'withdrawn',
        withdrawnAt: new Date().toISOString(),
      });
    }
    return result;
  }, [tenantId, userId, queryClient, source]);

  return {
    state: query.data,
    isPending: query.isPending,
    isError: query.isError,
    isGranted: isHealthConsentGranted(query.data),
    refetch: query.refetch,
    grant,
    withdraw,
  };
}
