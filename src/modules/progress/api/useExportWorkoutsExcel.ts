import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { logger, type WeightUnit } from '@/core/lib';
import { useTenancy } from '@/core/tenancy';
import { fetchClientHealthData, type ClientHealthData } from '@/modules/workouts';

import type { RawWorkout } from '../model/exercise-history';
import { getExcelTranslations } from '../model/excel-format';
import { exportWorkoutsToExcel } from '../model/export-excel';

export function clientHealthQueryKey(tenantId: string | null, clientId: string | null) {
  return ['workouts', 'coach-client-health', tenantId, clientId] as const;
}

export interface ExportWorkoutsExcelOptions {
  clientId: string | null;
  clientName?: string;
  workouts: RawWorkout[];
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>;
  unit: WeightUnit;
}

/**
 * Hook para exportar los entrenos a Excel (D-131, D-149).
 * Consulta los datos de salud bajo demanda reutilizando la caché de TanStack Query
 * si ya se abrió la pestaña de salud, y maneja errores mostrando mensajes traducidos (AGENTS §4).
 */
export function useExportWorkoutsExcel() {
  const { t } = useTranslation();
  const { tenant } = useTenancy();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const exportExcel = async (options: ExportWorkoutsExcelOptions) => {
    if (isExporting) return;
    setIsExporting(true);
    setErrorMessage(null);

    const translations = getExcelTranslations((key, opts) => (opts ? t(key, opts) : t(key)));

    try {
      let healthData: ClientHealthData | null = null;
      if (options.clientId && tenant?.id) {
        try {
          healthData = await queryClient.fetchQuery({
            queryKey: clientHealthQueryKey(tenant.id, options.clientId),
            queryFn: () => fetchClientHealthData(tenant.id, options.clientId!),
            staleTime: 5 * 60 * 1000,
          });
        } catch (healthError) {
          logger.warn('No se pudieron obtener los datos de salud para el Excel', {
            error: healthError,
          });
        }
      }

      const outcome = await exportWorkoutsToExcel({
        workouts: options.workouts,
        exerciseOptionsById: options.exerciseOptionsById,
        healthData,
        translations,
        unit: options.unit,
        clientName: options.clientName,
      });

      if (outcome === 'failed') {
        const msg = t('progress.excel.error');
        setErrorMessage(msg);
        logger.error('Fallo al exportar o descargar el archivo Excel', { outcome });
      }
    } catch (error) {
      const msg = t('progress.excel.error');
      setErrorMessage(msg);
      logger.error('Error no controlado al exportar entrenos a Excel', { error });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportExcel,
    isExporting,
    errorMessage,
    clearError: () => setErrorMessage(null),
  };
}
