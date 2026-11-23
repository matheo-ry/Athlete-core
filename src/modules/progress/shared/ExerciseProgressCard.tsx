import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate, formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';
import { Card, Icon, LineChart, Pill } from '@/core/ui';
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
import { ProgressStat } from './ProgressStat';
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

  const pctTone =
    rmProgressPct !== null && rmProgressPct > 0
      ? 'up'
      : rmProgressPct !== null && rmProgressPct < 0
        ? 'down'
        : 'neutral';

  return (
    <Card className="flex flex-col gap-4" data-testid={`exercise-card-${exercise.exerciseId}`}>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg leading-tight font-semibold">{exercise.displayName}</h3>
          {exercise.isUnilateral ? <Pill>{t('progress.exercise.unilateral')}</Pill> : null}
        </div>
        {recordParts.length > 0 ? (
          <p
            className="text-muted flex items-start gap-1.5 text-sm"
            data-testid={`record-${exercise.exerciseId}`}
          >
            <Icon name="trophy" className="text-accent mt-0.5 size-4 shrink-0" />
            <span>
              <span className="text-foreground font-semibold">{t('progress.stats.record')}:</span>{' '}
              <span className="numeric">{recordParts.join(' · ')}</span>
            </span>
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-2">
        <ProgressStat label={t('progress.stats.last')}>
          {selectedSession?.maxRm != null
            ? formatWeight(selectedSession.maxRm, unit, language)
            : '—'}
        </ProgressStat>
        <ProgressStat
          label={t('progress.stats.progressRm')}
          tone={pctTone}
          testId="rm-progress-badge"
        >
          {rmProgressPct !== null
            ? `${rmProgressPct > 0 ? '+' : ''}${String(rmProgressPct)} %`
            : '—'}
        </ProgressStat>
      </div>

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-1">
        <LineChart
          data={chartPoints}
          selectedPointId={selectedSession ? sessionId(selectedSession) : null}
          onSelectPoint={handleSelectPoint}
          formatDateLabel={(d) => formatDate(d, language)}
          emptyMessage={t('progress.chart.empty')}
          ariaLabel={`${exercise.displayName}: ${metricOptions.find((o) => o.key === metric)?.label ?? ''}`}
        />
        <p className="text-muted text-center text-xs">{t('progress.chart.tapHint')}</p>
      </div>

      {selectedSession ? (
        <ExerciseSessionDetail session={selectedSession} metric={metric} unit={unit} />
      ) : null}

      <ExerciseHistoryList exerciseId={exercise.exerciseId} history={history} />
    </Card>
  );
}
