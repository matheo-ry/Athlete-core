import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WeightUnit } from '@/core/lib';
import { Button, EmptyState, ErrorState, Icon, Pill, Spinner } from '@/core/ui';

import { useExportWorkoutsExcel } from '../api/useExportWorkoutsExcel';
import type { ProgramProgressGroup, RawWorkout } from '../model/exercise-history';
import { ChoiceChips } from './ChoiceChips';
import { ExerciseProgressCard } from './ExerciseProgressCard';
import { HealthProgressSection } from './HealthProgressSection';

export interface ProgressViewProps {
  clientId: string | null;
  groups: ProgramProgressGroup[];
  rawWorkouts?: RawWorkout[];
  exerciseOptionsById?: Map<string, { name: string; measurement: string; isUnilateral: boolean }>;
  clientName?: string;
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
  rawWorkouts = [],
  exerciseOptionsById = new Map(),
  clientName,
  isPending,
  isError,
  onRetry,
  unit,
  referenceDate,
  isCoach = false,
}: ProgressViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ProgressTab>('exercises');
  const { exportExcel, isExporting, errorMessage } = useExportWorkoutsExcel();

  const hasAnyExercise = groups.some((g) => g.exercises.length > 0);

  const handleExportExcel = () => {
    void exportExcel({
      clientId,
      clientName,
      workouts: rawWorkouts,
      exerciseOptionsById,
      unit,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Ejercicios o Peso y medidas + Botón Descargar Excel (D-131, D-150) */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <Button
            type="button"
            variant="secondary"
            onClick={handleExportExcel}
            disabled={isExporting}
            data-testid="download-excel-btn"
          >
            <Icon name="download" className="size-4" />
            <span>
              {isExporting ? t('progress.excel.downloading') : t('progress.excel.download')}
            </span>
          </Button>
        </div>

        {errorMessage && (
          <p role="alert" className="text-danger text-sm font-medium" data-testid="excel-error-msg">
            {errorMessage}
          </p>
        )}
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
                <header className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl leading-tight font-semibold">{group.programName}</h2>
                  <Pill tone={group.isCurrent ? 'primary' : 'neutral'}>
                    {group.isCurrent ? t('progress.routine.current') : t('progress.routine.past')}
                  </Pill>
                </header>

                <div className="flex flex-col gap-3">
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
