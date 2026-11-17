import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WeightUnit } from '@/core/lib';
import { EmptyState, ErrorState, Spinner } from '@/core/ui';

import type { ClientHealthData } from '../api/progress-api';
import type { ProgramProgressGroup } from '../model/exercise-history';
import { ExerciseProgressCard } from './ExerciseProgressCard';
import { HealthProgressSection } from './HealthProgressSection';

export interface ProgressViewProps {
  groups: ProgramProgressGroup[];
  healthData?: ClientHealthData | null;
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
  unit: WeightUnit;
  referenceDate?: string;
  isCoach?: boolean;
}

export function ProgressView({
  groups,
  healthData = null,
  isPending,
  isError,
  onRetry,
  unit,
  referenceDate,
  isCoach = false,
}: ProgressViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'exercises' | 'health'>('exercises');

  if (isPending) {
    return <Spinner />;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  const hasAnyExercise = groups.some((g) => g.exercises.length > 0);
  const hasHealthConsent = healthData?.hasConsent === true;
  const hasHealthData =
    hasHealthConsent && (healthData.weights.length > 0 || healthData.measurements.length > 0);

  if (!hasAnyExercise && !hasHealthData) {
    return (
      <EmptyState title={t('progress.empty.title')} description={t('progress.empty.description')} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de vista principal: Ejercicios o Peso y medidas */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            activeTab === 'exercises'
              ? 'bg-primary text-primary-contrast'
              : 'bg-surface hover:bg-surface-raised text-muted'
          }`}
          data-testid="tab-exercises"
        >
          {t('progress.tabs.exercises')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            activeTab === 'health'
              ? 'bg-primary text-primary-contrast'
              : 'bg-surface hover:bg-surface-raised text-muted'
          }`}
          data-testid="tab-health"
        >
          {t('progress.tabs.health')}
        </button>
      </div>

      {activeTab === 'exercises' ? (
        <div className="flex flex-col gap-6">
          {!hasAnyExercise ? (
            <EmptyState
              title={t('progress.empty.title')}
              description={t('progress.empty.description')}
            />
          ) : (
            groups.map((group) => {
              if (group.exercises.length === 0) {
                return null;
              }

              return (
                <section key={group.programId} className="flex flex-col gap-3">
                  <header className="flex items-center justify-between gap-2 border-b pb-2 border-border">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{group.programName}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          group.isCurrent
                            ? 'bg-primary/10 text-primary-readable'
                            : 'border border-border text-muted'
                        }`}
                      >
                        {group.isCurrent
                          ? t('progress.routine.current')
                          : t('progress.routine.past')}
                      </span>
                    </div>
                  </header>

                  <div className="flex flex-col gap-4">
                    {group.exercises.map((exercise) => (
                      <ExerciseProgressCard
                        key={exercise.exerciseId}
                        exercise={exercise}
                        unit={unit}
                        referenceDate={referenceDate}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      ) : (
        <HealthProgressSection
          healthData={healthData}
          unit={unit}
          referenceDate={referenceDate}
          isCoach={isCoach}
        />
      )}
    </div>
  );
}
