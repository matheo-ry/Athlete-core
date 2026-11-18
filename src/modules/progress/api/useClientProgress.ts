import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import type { WeightUnit } from '@/core/lib';
import { useTenancy } from '@/core/tenancy';
import { useExerciseOptions } from '@/modules/exercises';

import { fetchClientWorkouts, fetchCurrentClientProgramId } from './progress-api';
import { groupWorkoutsByProgram } from '../model/exercise-history';
import type { ExerciseInfo, ProgramProgressGroup, RawWorkout } from '../model/exercise-history';

export function progressQueryKey(tenantId: string | null, clientId: string | null) {
  return ['progress', 'client-workouts', tenantId, clientId] as const;
}

export function currentProgramQueryKey(tenantId: string | null, clientId: string | null) {
  return ['progress', 'current-program', tenantId, clientId] as const;
}

export interface UseClientProgressResult {
  groups: ProgramProgressGroup[];
  rawWorkouts: RawWorkout[];
  exerciseOptionsById: Map<string, { name: string; measurement: string; isUnilateral: boolean }>;
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

  // El peso y las medidas van aparte (HealthProgressSection): si fallan, los
  // ejercicios se siguen viendo.
  const isPending =
    workoutsQuery.isPending || currentProgramQuery.isPending || exerciseOptions.isPending;

  const isError = workoutsQuery.isError || currentProgramQuery.isError || exerciseOptions.isError;

  const exMap = useMemo(() => {
    const map = new Map<string, ExerciseInfo>();
    for (const [id, opt] of exerciseOptions.byId.entries()) {
      map.set(id, {
        id: opt.id,
        name: opt.name,
        measurement: opt.measurement,
        isUnilateral: opt.isUnilateral,
      });
    }
    return map;
  }, [exerciseOptions.byId]);

  const groups = useMemo(() => {
    if (!workoutsQuery.data) {
      return [];
    }

    return groupWorkoutsByProgram(
      workoutsQuery.data,
      exMap,
      currentProgramQuery.data ?? null,
      language,
      unit,
      (n) => t('progress.history.dayLabel', { number: n }),
    );
  }, [workoutsQuery.data, currentProgramQuery.data, exMap, language, unit, t]);

  const refetch = async () => {
    await Promise.all([workoutsQuery.refetch(), currentProgramQuery.refetch()]);
  };

  return {
    groups,
    rawWorkouts: workoutsQuery.data ?? [],
    exerciseOptionsById: exMap,
    isPending,
    isError,
    refetch,
    unit,
  };
}
