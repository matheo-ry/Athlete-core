import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate, formatLength, formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';
import { Card, EmptyState, ErrorState, LineChart, Spinner } from '@/core/ui';
import type { ChartPoint } from '@/core/ui';
import { useClientHealthData } from '@/modules/workouts';
import type { ClientHealthData } from '@/modules/workouts';

import {
  WEIGHT_METRIC,
  groupMeasurements,
  resolveHealthMetric,
  summarizeHealthRecords,
} from '../model/health-summary';
import type { HealthSummary } from '../model/health-summary';
import {
  buildMeasurementChartPoints,
  buildWeightChartPoints,
  filterHealthDataByPeriod,
} from '../model/progress-charts';
import type { ProgressPeriod } from '../model/progress-charts';
import { ChoiceChips } from './ChoiceChips';
import type { ChoiceOption } from './ChoiceChips';
import { usePeriodOptions } from './usePeriodOptions';

interface HealthProgressSectionProps {
  clientId: string | null;
  unit: WeightUnit;
  referenceDate?: string;
  isCoach?: boolean;
}

/**
 * Pestaña "Peso y medidas" (D-127). Carga sus datos solo al abrirla y trata
 * sus propios estados: si falla, los ejercicios siguen viéndose.
 */
export function HealthProgressSection({
  clientId,
  unit,
  referenceDate,
  isCoach = false,
}: HealthProgressSectionProps) {
  const { t } = useTranslation();
  const query = useClientHealthData(clientId);

  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  // Sin consentimiento no se enseña nada (D-126). Es solo la pantalla: quien
  // protege los datos es el RLS de body_weights y body_measurements.
  if (!query.data.hasConsent) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted" data-testid="no-health-consent-msg">
          {isCoach ? t('progress.health.noConsentCoach') : t('progress.health.noConsentClient')}
        </p>
      </Card>
    );
  }

  if (query.data.weights.length === 0 && query.data.measurements.length === 0) {
    return <EmptyState title={t('progress.health.empty')} />;
  }

  return <HealthCharts data={query.data} unit={unit} referenceDate={referenceDate} />;
}

interface HealthChartsProps {
  data: ClientHealthData;
  unit: WeightUnit;
  referenceDate?: string;
}

function HealthCharts({ data, unit, referenceDate }: HealthChartsProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const periodOptions = usePeriodOptions();
  const [period, setPeriod] = useState<ProgressPeriod>('all');
  const [chosenMetric, setChosenMetric] = useState<string | null>(null);

  const { weights } = data;
  const groups = useMemo(() => groupMeasurements(data.measurements), [data.measurements]);
  const metric = resolveHealthMetric(chosenMetric, weights.length > 0, [...groups.keys()]);
  const isWeight = metric === WEIGHT_METRIC;

  const metricOptions = useMemo(() => {
    const options: ChoiceOption<string>[] =
      weights.length > 0 ? [{ key: WEIGHT_METRIC, label: t('progress.health.bodyWeight') }] : [];
    for (const [key, records] of groups) {
      const first = records[0]!;
      const kind = t(`progress.health.kinds.${first.kind}`);
      const label = first.side ? `${kind} (${t(`progress.health.side.${first.side}`)})` : kind;
      options.push({ key, label });
    }
    return options;
  }, [weights.length, groups, t]);

  const { points, summary } = useMemo<{
    points: readonly ChartPoint[];
    summary: HealthSummary | null;
  }>(() => {
    if (isWeight) {
      const filtered = filterHealthDataByPeriod(weights, period, referenceDate);
      return {
        points: buildWeightChartPoints(filtered, unit, language),
        summary: summarizeHealthRecords(
          filtered,
          (w) => w.weight_kg,
          (kg) => formatWeight(kg, unit, language),
        ),
      };
    }
    const filtered = filterHealthDataByPeriod(
      groups.get(metric ?? '') ?? [],
      period,
      referenceDate,
    );
    return {
      points: buildMeasurementChartPoints(filtered, unit, language),
      summary: summarizeHealthRecords(
        filtered,
        (m) => m.value_cm,
        (cm) => formatLength(cm, unit, language),
      ),
    };
  }, [isWeight, weights, groups, metric, period, referenceDate, unit, language]);

  const metricLabel =
    metricOptions.find((o) => o.key === metric)?.label ?? t('progress.health.measurements');

  return (
    <Card className="flex flex-col gap-4 p-4" data-testid="health-progress-card">
      <h2 className="text-lg font-bold text-foreground">{t('progress.health.title')}</h2>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-2">
        <ChoiceChips
          label={t('progress.metric.label')}
          options={metricOptions}
          value={metric ?? ''}
          onChange={setChosenMetric}
          testIdPrefix="health-metric"
        />
        <ChoiceChips
          label={t('progress.period.label')}
          options={periodOptions}
          value={period}
          onChange={setPeriod}
          testIdPrefix="health-period"
        />
      </div>

      {summary ? (
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1">
            <span className="text-muted">{t('progress.stats.last')}:</span>
            <span className="font-bold text-foreground">{summary.last}</span>
          </div>
          {summary.change !== null ? (
            <div className="flex items-center gap-1" data-testid="health-diff-stat">
              <span className="text-muted">{t('progress.health.change')}:</span>
              <span className="font-bold text-primary-readable">{summary.change}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <LineChart
          data={points}
          formatDateLabel={(d) => formatDate(d, language)}
          emptyMessage={t('progress.chart.empty')}
          ariaLabel={metricLabel}
        />
        <p className="text-center text-xs text-muted italic">{t('progress.chart.tapHint')}</p>
      </div>
    </Card>
  );
}
