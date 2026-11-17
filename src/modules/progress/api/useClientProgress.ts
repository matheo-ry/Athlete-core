import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import type { WeightUnit } from '@/core/lib';
import { useTenancy } from '@/core/tenancy';
import { useExerciseOptions } from '@/modules/exercises';

import {
  fetchClientHealthData,
  fetchClientWorkouts,
  fetchCurrentClientProgramId,
} from './progress-api';
import type { ClientHealthData } from './progress-api';
import { groupWorkoutsByProgram } from '../model/exercise-history';
import type { ExerciseInfo, ProgramProgressGroup } from '../model/exercise-history';

export function progressQueryKey(tenantId: string | null, clientId: string | null) {
  return ['progress', 'client-workouts', tenantId, clientId] as const;
}

export function currentProgramQueryKey(tenantId: string | null, clientId: string | null) {
  return ['progress', 'current-program', tenantId, clientId] as const;
}

export function healthDataQueryKey(tenantId: string | null, clientId: string | null) {
  return ['progress', 'health-data', tenantId, clientId] as const;
}

export interface UseClientProgressResult {
  groups: ProgramProgressGroup[];
  healthData: ClientHealthData | null;
  isPending: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
  unit: WeightUnit;
}

export function useClientProgress(clientId: string | null): UseClientProgressResult {
  const { tenant } = useTenancy();
  const tenantId = tenant?.id ?? null;
  const { t } = useTranslation();
  const language = useLanguage();
  const profile = useProfile();
  const unit: WeightUnit = profile.data?.weightUnit ?? 'kg';
  const exerciseOptions = useExerciseOptions();

  const workoutsQuery = useQuery({
    queryKey: progressQueryKey(tenantId, clientId),
    queryFn: () => fetchClientWorkouts(tenantId ?? '', clientId ?? ''),
    enabled: tenantId !== null && clientId !== null,
  });

  const currentProgramQuery = useQuery({
    queryKey: currentProgramQueryKey(tenantId, clientId),
    queryFn: () => fetchCurrentClientProgramId(tenantId ?? '', clientId ?? ''),
    enabled: tenantId !== null && clientId !== null,
  });

  const healthQuery = useQuery({
    queryKey: healthDataQueryKey(tenantId, clientId),
    queryFn: () => fetchClientHealthData(tenantId ?? '', clientId ?? ''),
    enabled: tenantId !== null && clientId !== null,
  });

  const isPending =
    workoutsQuery.isPending ||
    currentProgramQuery.isPending ||
    exerciseOptions.isPending ||
    healthQuery.isPending;

  const isError =
    workoutsQuery.isError ||
    currentProgramQuery.isError ||
    exerciseOptions.isError ||
    healthQuery.isError;

  const groups = useMemo(() => {
    if (!workoutsQuery.data) {
      return [];
    }

    const exMap = new Map<string, ExerciseInfo>();
    for (const [id, opt] of exerciseOptions.byId.entries()) {
      exMap.set(id, {
        id: opt.id,
        name: opt.name,
        measurement: opt.measurement,
        isUnilateral: opt.isUnilateral,
      });
    }

    return groupWorkoutsByProgram(
      workoutsQuery.data,
      exMap,
      currentProgramQuery.data ?? null,
      language,
      unit,
      (n) => t('progress.history.dayLabel', { number: n }),
    );
  }, [workoutsQuery.data, currentProgramQuery.data, exerciseOptions.byId, language, unit, t]);

  const refetch = async () => {
    await Promise.all([
      workoutsQuery.refetch(),
      currentProgramQuery.refetch(),
      healthQuery.refetch(),
    ]);
  };

  return {
    groups,
    healthData: healthQuery.data ?? null,
    isPending,
    isError,
    refetch,
    unit,
  };
}
