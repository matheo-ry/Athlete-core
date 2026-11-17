import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import type { WeightUnit } from '@/core/lib';
import { useTenancy } from '@/core/tenancy';
import { Button, EmptyState, ErrorState, Icon, Spinner } from '@/core/ui';
import { fetchClientHealthData, type ClientHealthData } from '@/modules/workouts';

import type { ProgramProgressGroup, RawWorkout } from '../model/exercise-history';
import { exportWorkoutsToExcel } from '../model/export-excel';
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
  const language = useLanguage();
  const { tenant } = useTenancy();
  const [activeTab, setActiveTab] = useState<ProgressTab>('exercises');
  const [isExporting, setIsExporting] = useState(false);

  const hasAnyExercise = groups.some((g) => g.exercises.length > 0);

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      let healthData: ClientHealthData | null = null;
      if (clientId && tenant?.id) {
        try {
          healthData = await fetchClientHealthData(tenant.id, clientId);
        } catch {
          // Si falla la salud, se exporta el Excel sin hoja de peso
        }
      }

      await exportWorkoutsToExcel({
        workouts: rawWorkouts,
        exerciseOptionsById,
        healthData,
        unit,
        language,
        clientName,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Ejercicios o Peso y medidas + Botón Descargar Excel (D-131) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
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
          onClick={() => void handleExportExcel()}
          disabled={isExporting}
          data-testid="download-excel-btn"
          className="min-h-11 inline-flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="download" className="size-4" />
          <span>
            {isExporting ? t('progress.excel.downloading') : t('progress.excel.download')}
          </span>
        </Button>
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
