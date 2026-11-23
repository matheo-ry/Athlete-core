import { Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate, formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';
import { Card, LineChart } from '@/core/ui';
import type { ChartPoint } from '@/core/ui';

import type { ExerciseProgressItem, ExerciseSessionHistory } from '../model/exercise-history';
import {
  buildExerciseChartPoints,
  calculateRmProgressPercentage,
  filterSessionsByPeriod,
} from '../model/progress-charts';
import type { ExerciseChartMetric, ProgressPeriod } from '../model/progress-charts';
import { ChoiceChips } from './ChoiceChips';
import { ExerciseHistoryList } from './ExerciseHistoryList';
import { ExerciseSessionDetail } from './ExerciseSessionDetail';
import { usePeriodOptions } from './usePeriodOptions';

interface ExerciseProgressCardProps {
  exercise: ExerciseProgressItem;
  unit: WeightUnit;
  referenceDate?: string;
}

const sessionId = (s: ExerciseSessionHistory) => `${s.workoutId}-${s.sessionNumber}`;

export function ExerciseProgressCard({ exercise, unit, referenceDate }: ExerciseProgressCardProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const periodOptions = usePeriodOptions();

  const [metric, setMetric] = useState<ExerciseChartMetric>('estimated_rm');
  const [period, setPeriod] = useState<ProgressPeriod>('all');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const { records, history } = exercise;

  const metricOptions = useMemo(
    () =>
      [
        { key: 'estimated_rm', label: t('progress.metric.estimatedRm') },
        { key: 'max_weight', label: t('progress.metric.maxWeight') },
        { key: 'volume', label: t('progress.metric.volume') },
        { key: 'reps', label: t('progress.metric.reps') },
      ] as const,
    [t],
  );

  const filteredSessions = useMemo(
    () => filterSessionsByPeriod(history, period, referenceDate),
    [history, period, referenceDate],
  );

  // Porcentaje de progreso por RM estimado (D-129)
  const rmProgressPct = useMemo(
    () => calculateRmProgressPercentage(filteredSessions),
    [filteredSessions],
  );

  const chartPoints = useMemo(
    () =>
      buildExerciseChartPoints(filteredSessions, metric, unit, language, (count) =>
        t('progress.metric.repsCount', { count }),
      ),
    [filteredSessions, metric, unit, language, t],
  );

  // Sesión elegida en la gráfica o, si no, la última del periodo.
  const selectedSession = useMemo<ExerciseSessionHistory | null>(() => {
    const found = filteredSessions.find((s) => sessionId(s) === selectedPointId);
    return found ?? filteredSessions[filteredSessions.length - 1] ?? null;
  }, [filteredSessions, selectedPointId]);

  const handleSelectPoint = (point: ChartPoint<ExerciseSessionHistory>) => {
    if (point.id) setSelectedPointId(point.id);
  };

  const recordParts: string[] = [];
  if (records.maxWeightKg != null && records.maxWeightKg > 0) {
    recordParts.push(
      `${t('progress.stats.maxWeight')}: ${formatWeight(records.maxWeightKg, unit, language)}`,
    );
  }
  if (records.maxRm != null && records.maxRm > 0) {
    recordParts.push(
      `${t('progress.stats.estimatedRm')}: ${formatWeight(records.maxRm, unit, language)}`,
    );
  }

  let pctClass = 'text-foreground';
  if (rmProgressPct !== null && rmProgressPct > 0) pctClass = 'text-primary-readable';
  if (rmProgressPct !== null && rmProgressPct < 0) pctClass = 'text-accent';

  return (
    <Card className="flex flex-col gap-5" data-testid={`exercise-card-${exercise.exerciseId}`}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="display text-foreground text-[1.4rem]">{exercise.displayName}</h3>
          {exercise.isUnilateral ? (
            <span className="text-muted rounded-full px-2.5 py-0.5 text-xs font-medium shadow-[inset_0_0_0_1px_var(--color-hairline-strong)]">
              {t('progress.exercise.unilateral')}
            </span>
          ) : null}
        </div>

        {recordParts.length > 0 ? (
          <div className="flex items-center gap-1.5" data-testid={`record-${exercise.exerciseId}`}>
            <span className="bg-primary-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
              <Trophy aria-hidden="true" className="text-primary-readable size-3.5" />
              <span className="text-primary-readable font-bold">{t('progress.stats.record')}:</span>
              {recordParts.join(' · ')}
            </span>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ChoiceChips
          label={t('progress.metric.label')}
          options={metricOptions}
          value={metric}
          onChange={setMetric}
          testIdPrefix="metric-btn"
        />
        <ChoiceChips
          label={t('progress.period.label')}
          options={periodOptions}
          value={period}
          onChange={(p) => {
            setPeriod(p);
            setSelectedPointId(null);
          }}
          testIdPrefix="period-btn"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {selectedSession?.maxRm != null ? (
          <div className="bg-glass flex flex-col gap-1 rounded-2xl px-4 py-3 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
            <span className="eyebrow text-muted">{t('progress.stats.last')}:</span>
            <span className="numeral text-foreground text-2xl">
              {formatWeight(selectedSession.maxRm, unit, language)}
            </span>
          </div>
        ) : null}

        <div
          className="bg-glass flex flex-col gap-1 rounded-2xl px-4 py-3 shadow-[inset_0_0_0_1px_var(--color-hairline)]"
          data-testid="rm-progress-badge"
        >
          <span className="eyebrow text-muted">{t('progress.stats.progressRm')}:</span>
          {rmProgressPct !== null ? (
            <span className={`numeral text-2xl ${pctClass}`}>
              {rmProgressPct > 0 ? `+${rmProgressPct}` : rmProgressPct} %
            </span>
          ) : (
            <span className="numeral text-muted text-2xl">—</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <LineChart
          data={chartPoints}
          selectedPointId={selectedSession ? sessionId(selectedSession) : null}
          onSelectPoint={handleSelectPoint}
          formatDateLabel={(d) => formatDate(d, language)}
          emptyMessage={t('progress.chart.empty')}
          ariaLabel={`${exercise.displayName}: ${metricOptions.find((o) => o.key === metric)?.label ?? ''}`}
        />
        <p className="text-center text-xs text-muted italic">{t('progress.chart.tapHint')}</p>
      </div>

      {selectedSession ? (
        <ExerciseSessionDetail session={selectedSession} metric={metric} unit={unit} />
      ) : null}

      <ExerciseHistoryList exerciseId={exercise.exerciseId} history={history} />
    </Card>
  );
}
