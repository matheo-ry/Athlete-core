import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/core/auth';
import { useHealthConsent, useTenancy } from '@/core/tenancy';

import { latestWeight } from '../model/body-weight';
import type { BodyMeasurementInput, BodyWriteResult } from './body-data-api';
import {
  deleteBodyMeasurement,
  deleteBodyWeight,
  saveBodyMeasurement,
  saveBodyWeight,
} from './body-data-api';
import { clientHealthQueryKey } from './useClientWorkouts';
import { fetchClientHealthData } from './workouts-coach-api';

/** Lo que pasa al apuntar: `offline` si no hay conexión (D-061: sin ella no se intenta). */
export type BodyWriteStatus = BodyWriteResult | 'offline';

export type OwnHealthData = ReturnType<typeof useOwnHealthData>;

/**
 * El peso y las medidas del propio cliente en el espacio activo (D-127). Solo
 * se piden con el consentimiento dado (D-126); sin él, todo está vacío. Son la
 * misma consulta que lee `progress`, así que sus gráficas se actualizan solas.
 */
export function useOwnHealthData() {
  const { tenant } = useTenancy();
  const { user } = useAuth();
  const consent = useHealthConsent();
  const tenantId = tenant?.id ?? null;
  const userId = user?.id ?? null;
  const isGranted = consent.isGranted;

  const query = useQuery({
    queryKey: clientHealthQueryKey(tenantId, userId),
    queryFn: () => fetchClientHealthData(tenantId ?? '', userId ?? ''),
    enabled: tenantId !== null && userId !== null && isGranted,
  });

  const weights = isGranted ? (query.data?.weights ?? []) : [];
  const measurements = isGranted ? (query.data?.measurements ?? []) : [];

  return {
    isGranted,
    weights,
    measurements,
    latest: latestWeight(weights),
    /** Cargando el consentimiento o los datos. */
    isPending: consent.isPending || (isGranted && query.isPending),
    isError: consent.isError || (isGranted && query.isError),
    refetch: () => {
      void consent.refetch();
      if (isGranted) {
        void query.refetch();
      }
    },
  };
}

/**
 * El último peso apuntado, para el total con lastre (D-127); `null` sin
 * consentimiento o sin peso. Mientras entrena, vale lo ya cargado: la caché
 * está en el teléfono y funciona sin cobertura.
 */
export function useLatestBodyWeightKg(): number | null {
  const { tenant } = useTenancy();
  const { user } = useAuth();
  const { isGranted } = useHealthConsent();
  const tenantId = tenant?.id ?? null;
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: clientHealthQueryKey(tenantId, userId),
    queryFn: () => fetchClientHealthData(tenantId ?? '', userId ?? ''),
    enabled: tenantId !== null && userId !== null && isGranted,
    select: (data) => latestWeight(data.weights)?.weight_kg ?? null,
  });

  return isGranted ? (query.data ?? null) : null;
}

type WriteFn<Variables> = (
  tenantId: string,
  userId: string,
  variables: Variables,
) => Promise<BodyWriteResult>;

/** Una escritura de peso o medidas: sin conexión no se intenta, y al acabar se vuelven a pedir los datos. */
function useBodyWrite<Variables>(write: WriteFn<Variables>) {
  const { tenant } = useTenancy();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = tenant?.id ?? null;
  const userId = user?.id ?? null;

  return useMutation<BodyWriteStatus, Error, Variables>({
    mutationFn: async (variables) => {
      if (!navigator.onLine) {
        return 'offline';
      }
      if (tenantId === null || userId === null) {
        return 'error';
      }
      return write(tenantId, userId, variables);
    },
    onSuccess: async (status) => {
      if (status === 'ok') {
        await queryClient.invalidateQueries({ queryKey: clientHealthQueryKey(tenantId, userId) });
      }
    },
  });
}

export function useSaveBodyWeight() {
  return useBodyWrite<{ measuredOn: string; weightKg: number }>(
    (tenantId, userId, { measuredOn, weightKg }) =>
      saveBodyWeight(tenantId, userId, measuredOn, weightKg),
  );
}

export function useSaveBodyMeasurement() {
  return useBodyWrite<BodyMeasurementInput>((tenantId, userId, input) =>
    saveBodyMeasurement(tenantId, userId, input),
  );
}

export function useDeleteBodyWeight() {
  return useBodyWrite<string>((tenantId, _userId, id) => deleteBodyWeight(tenantId, id));
}

export function useDeleteBodyMeasurement() {
  return useBodyWrite<string>((tenantId, _userId, id) => deleteBodyMeasurement(tenantId, id));
}
