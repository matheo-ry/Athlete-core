import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';
import { Card, EmptyState, LineChart } from '@/core/ui';
import type { ChartPoint } from '@/core/ui';

import type { BodyMeasurementRecord, ClientHealthData } from '../api/progress-api';
import {
  buildMeasurementChartPoints,
  buildWeightChartPoints,
  filterHealthDataByPeriod,
} from '../model/progress-charts';
import type { ProgressPeriod } from '../model/progress-charts';

interface HealthProgressSectionProps {
  healthData: ClientHealthData | null;
  unit: WeightUnit;
  referenceDate?: string;
  isCoach?: boolean;
}

export function HealthProgressSection({
  healthData,
  unit,
  referenceDate,
  isCoach = false,
}: HealthProgressSectionProps) {
  const { t } = useTranslation();
  const language = useLanguage();

  const [period, setPeriod] = useState<ProgressPeriod>('all');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('weight');

  const hasConsent = healthData?.hasConsent === true;
  const weights = useMemo(() => healthData?.weights ?? [], [healthData?.weights]);
  const measurements = useMemo(() => healthData?.measurements ?? [], [healthData?.measurements]);

  // Agrupar medidas por tipo y lado
  const measurementGroups = useMemo(() => {
    const map = new Map<string, { label: string; records: BodyMeasurementRecord[] }>();

    for (const m of measurements) {
      const key = m.side ? `${m.kind}-${m.side}` : m.kind;
      let entry = map.get(key);
      if (!entry) {
        const kindLabel = t(`progress.health.kinds.${m.kind}`);
        const sideLabel = m.side ? ` (${t(`progress.health.side.${m.side}`)})` : '';
        entry = {
          label: `${kindLabel}${sideLabel}`,
          records: [],
        };
        map.set(key, entry);
      }
      entry.records.push(m);
    }

    return map;
  }, [measurements, t]);

  // Filtrar según métrica y periodo
  const isWeightSelected = selectedMetricKey === 'weight';

  const currentWeightPoints = useMemo(() => {
    if (!isWeightSelected) return [];
    const filtered = filterHealthDataByPeriod(weights, period, referenceDate);
    return buildWeightChartPoints(filtered, unit, language);
  }, [isWeightSelected, weights, period, referenceDate, unit, language]);

  const currentMeasurementPoints = useMemo(() => {
    if (isWeightSelected) return [];
    const group = measurementGroups.get(selectedMetricKey);
    if (!group) return [];
    const filtered = filterHealthDataByPeriod(group.records, period, referenceDate);
    return buildMeasurementChartPoints(filtered, unit);
  }, [isWeightSelected, selectedMetricKey, measurementGroups, period, referenceDate, unit]);

  const chartPoints: readonly ChartPoint[] = isWeightSelected
    ? currentWeightPoints
    : currentMeasurementPoints;

  // Estadísticas del periodo
  const stats = useMemo(() => {
    if (chartPoints.length === 0) return null;

    const first = chartPoints[0]!;
    const last = chartPoints[chartPoints.length - 1]!;
    const diff = Math.round((last.value - first.value) * 10) / 10;
    const diffSign = diff > 0 ? `+${diff}` : `${diff}`;

    const values = chartPoints.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      last: last.formattedValue ?? last.value.toString(),
      diff: chartPoints.length >= 2 ? diffSign : null,
      min,
      max,
    };
  }, [chartPoints]);

  // Sin consentimiento
  if (!hasConsent) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted" data-testid="no-health-consent-msg">
          {isCoach ? t('progress.health.noConsentCoach') : t('progress.health.noConsentClient')}
        </p>
      </Card>
    );
  }

  const hasAnyData = weights.length > 0 || measurements.length > 0;
  if (!hasAnyData) {
    return <EmptyState title={t('progress.health.empty')} />;
  }

  return (
    <Card className="flex flex-col gap-4 p-4" data-testid="health-progress-card">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-foreground">{t('progress.health.title')}</h2>
      </header>

      {/* Selectores de métrica y periodo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/60 py-2">
        {/* Selector de métrica (Peso o Medidas disponibles) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {weights.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedMetricKey('weight')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                isWeightSelected
                  ? 'bg-primary text-primary-contrast'
                  : 'bg-surface-raised hover:bg-surface-raised/80 text-muted'
              }`}
              data-testid="health-metric-weight"
            >
              {t('progress.health.bodyWeight')}
            </button>
          ) : null}

          {Array.from(measurementGroups.entries()).map(([key, group]) => {
            const active = selectedMetricKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMetricKey(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-contrast'
                    : 'bg-surface-raised hover:bg-surface-raised/80 text-muted'
                }`}
                data-testid={`health-metric-${key}`}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        {/* Selector de periodo */}
        <div className="flex items-center gap-1">
          {(['4w', '3m', 'all'] as const).map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-contrast'
                    : 'bg-surface-raised hover:bg-surface-raised/80 text-muted'
                }`}
                data-testid={`health-period-${p}`}
              >
                {p === '4w' && t('progress.period.fourWeeks')}
                {p === '3m' && t('progress.period.threeMonths')}
                {p === 'all' && t('progress.period.all')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resumen de estadísticas del periodo */}
      {stats ? (
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1">
            <span className="text-muted">{t('progress.stats.last')}:</span>
            <span className="font-bold text-foreground">{stats.last}</span>
          </div>

          {stats.diff !== null ? (
            <div className="flex items-center gap-1" data-testid="health-diff-stat">
              <span className="text-muted">{t('progress.health.change')}:</span>
              <span className="font-bold text-primary">
                {stats.diff}{' '}
                {isWeightSelected ? (unit === 'lb' ? 'lb' : 'kg') : unit === 'lb' ? 'in' : 'cm'}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Gráfica de línea */}
      <div className="flex flex-col gap-1">
        <LineChart
          data={chartPoints}
          formatDateLabel={(d) => formatDate(d, language)}
          emptyMessage={t('progress.chart.empty')}
          ariaLabel={
            isWeightSelected
              ? t('progress.health.bodyWeight')
              : (measurementGroups.get(selectedMetricKey)?.label ??
                t('progress.health.measurements'))
          }
        />
        <p className="text-[11px] text-muted italic text-center">{t('progress.chart.tapHint')}</p>
      </div>
    </Card>
  );
}
