import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WeightUnit } from '@/core/lib';
import { EmptyState, ErrorState, Spinner } from '@/core/ui';

import type { ProgramProgressGroup } from '../model/exercise-history';
import { ChoiceChips } from './ChoiceChips';
import { ExerciseProgressCard } from './ExerciseProgressCard';
import { HealthProgressSection } from './HealthProgressSection';

export interface ProgressViewProps {
  clientId: string | null;
  groups: ProgramProgressGroup[];
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
  unit: WeightUnit;
  referenceDate?: string;
  isCoach?: boolean;
}

type ProgressTab = 'exercises' | 'health';

export function ProgressView({
  clientId,
  groups,
  isPending,
  isError,
  onRetry,
  unit,
  referenceDate,
  isCoach = false,
}: ProgressViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ProgressTab>('exercises');

  const hasAnyExercise = groups.some((g) => g.exercises.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Ejercicios o Peso y medidas. Cada pestaña trata sus propios estados:
          un fallo en una no esconde la otra. */}
      <div className="border-b border-border pb-2">
        <ChoiceChips
          label={t('progress.title')}
          options={[
            { key: 'exercises', label: t('progress.tabs.exercises') },
            { key: 'health', label: t('progress.tabs.health') },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          testIdPrefix="tab"
        />
      </div>

      {activeTab === 'health' ? (
        <HealthProgressSection
          clientId={clientId}
          unit={unit}
          referenceDate={referenceDate}
          isCoach={isCoach}
        />
      ) : isPending ? (
        <Spinner />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : !hasAnyExercise ? (
        <EmptyState
          title={t('progress.empty.title')}
          description={t('progress.empty.description')}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups
            .filter((group) => group.exercises.length > 0)
            .map((group) => (
              <section key={group.programId} className="flex flex-col gap-3">
                <header className="flex items-center gap-2 border-b border-border pb-2">
                  <h2 className="text-xl font-bold">{group.programName}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      group.isCurrent
                        ? 'bg-primary/10 text-primary-readable'
                        : 'border border-border text-muted'
                    }`}
                  >
                    {group.isCurrent ? t('progress.routine.current') : t('progress.routine.past')}
                  </span>
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
            ))}
        </div>
      )}
    </div>
  );
}
