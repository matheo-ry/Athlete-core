import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate, formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';
import { Card, LineChart, buttonClassName } from '@/core/ui';
import type { ChartPoint } from '@/core/ui';

import type { ExerciseProgressItem, ExerciseSessionHistory } from '../model/exercise-history';
import {
  buildExerciseChartPoints,
  calculateRmProgressPercentage,
  filterSessionsByPeriod,
} from '../model/progress-charts';
import type { ExerciseChartMetric, ProgressPeriod } from '../model/progress-charts';

interface ExerciseProgressCardProps {
  exercise: ExerciseProgressItem;
  unit: WeightUnit;
  referenceDate?: string;
}

export function ExerciseProgressCard({ exercise, unit, referenceDate }: ExerciseProgressCardProps) {
  const { t } = useTranslation();
  const language = useLanguage();

  const [metric, setMetric] = useState<ExerciseChartMetric>('estimated_rm');
  const [period, setPeriod] = useState<ProgressPeriod>('all');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  const { records, history } = exercise;

  // Filtrar sesiones según el periodo elegido
  const filteredSessions = useMemo(() => {
    return filterSessionsByPeriod(history, period, referenceDate);
  }, [history, period, referenceDate]);

  // Porcentaje de progreso por RM estimado (D-129)
  const rmProgressPct = useMemo(() => {
    return calculateRmProgressPercentage(filteredSessions);
  }, [filteredSessions]);

  // Puntos para la gráfica
  const chartPoints = useMemo(() => {
    return buildExerciseChartPoints(filteredSessions, metric, unit, language);
  }, [filteredSessions, metric, unit, language]);

  // Sesión seleccionada (al pulsar en la gráfica o la última por defecto)
  const selectedSession = useMemo<ExerciseSessionHistory | null>(() => {
    if (filteredSessions.length === 0) return null;
    if (selectedPointId) {
      const found = filteredSessions.find(
        (s) => `${s.workoutId}-${s.sessionNumber}` === selectedPointId,
      );
      if (found) return found;
    }
    return filteredSessions[filteredSessions.length - 1] ?? null;
  }, [filteredSessions, selectedPointId]);

  const handleSelectPoint = (point: ChartPoint<ExerciseSessionHistory>) => {
    if (point.id) {
      setSelectedPointId(point.id);
    }
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

  return (
    <Card className="flex flex-col gap-4 p-4" data-testid={`exercise-card-${exercise.exerciseId}`}>
      {/* Cabecera del ejercicio con récords */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">{exercise.displayName}</h3>
          {exercise.isUnilateral ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
              Unilateral
            </span>
          ) : null}
        </div>

        {recordParts.length > 0 ? (
          <div className="flex items-center gap-1.5" data-testid={`record-${exercise.exerciseId}`}>
            <span className="inline-flex items-center rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-semibold">
              <span className="text-primary font-bold mr-1">★ {t('progress.stats.record')}:</span>
              {recordParts.join(' · ')}
            </span>
          </div>
        ) : null}
      </header>

      {/* Selectores de métrica y periodo */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border/60 py-2">
        {/* Selector de métricas */}
        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label={t('progress.chart.title')}
        >
          {(['estimated_rm', 'max_weight', 'volume', 'reps'] as const).map((m) => {
            const active = metric === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-contrast'
                    : 'bg-surface-raised hover:bg-surface-raised/80 text-muted'
                }`}
                data-testid={`metric-btn-${m}`}
              >
                {m === 'estimated_rm' && t('progress.metric.estimatedRm')}
                {m === 'max_weight' && t('progress.metric.maxWeight')}
                {m === 'volume' && t('progress.metric.volume')}
                {m === 'reps' && t('progress.metric.reps')}
              </button>
            );
          })}
        </div>

        {/* Selector de periodo temporal */}
        <div className="flex items-center gap-1" role="group" aria-label={t('progress.period.all')}>
          {(['4w', '3m', 'all'] as const).map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  setSelectedPointId(null);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-contrast'
                    : 'bg-surface-raised hover:bg-surface-raised/80 text-muted'
                }`}
                data-testid={`period-btn-${p}`}
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
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
        {selectedSession?.maxRm != null && (
          <div className="flex items-center gap-1">
            <span className="text-muted">{t('progress.stats.last')}:</span>
            <span className="font-bold text-foreground">
              {formatWeight(selectedSession.maxRm, unit, language)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5" data-testid="rm-progress-badge">
          <span className="text-muted">{t('progress.stats.progressRm')}:</span>
          {rmProgressPct !== null ? (
            <span
              className={`font-bold ${
                rmProgressPct > 0
                  ? 'text-primary'
                  : rmProgressPct < 0
                    ? 'text-accent'
                    : 'text-foreground'
              }`}
            >
              {rmProgressPct > 0 ? `+${rmProgressPct}` : rmProgressPct} %
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </div>
      </div>

      {/* Gráfica de línea (SVG propio) */}
      <div className="flex flex-col gap-1">
        <LineChart
          data={chartPoints}
          selectedPointId={
            selectedPointId ??
            (selectedSession
              ? `${selectedSession.workoutId}-${selectedSession.sessionNumber}`
              : null)
          }
          onSelectPoint={handleSelectPoint}
          formatDateLabel={(d) => formatDate(d, language)}
          emptyMessage={t('progress.chart.empty')}
          ariaLabel={`${exercise.displayName} - ${t('progress.chart.title')}`}
        />
        <p className="text-[11px] text-muted italic text-center">{t('progress.chart.tapHint')}</p>
      </div>

      {/* Detalle del entreno elegido (series y notas debajo de la gráfica) */}
      {selectedSession ? (
        <div
          className="rounded-lg border border-border bg-surface-raised/40 p-3 flex flex-col gap-2"
          data-testid="selected-workout-detail"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">{selectedSession.label}</span>
              <span className="text-xs text-muted">
                {formatDate(selectedSession.performedOn, language)}
              </span>
            </div>
            <span className="font-mono text-xs text-primary font-bold">
              {metric === 'estimated_rm' && selectedSession.maxRm != null
                ? `${t('progress.stats.estimatedRm')}: ${formatWeight(selectedSession.maxRm, unit, language)}`
                : metric === 'max_weight' && selectedSession.maxWeightKg != null
                  ? `${t('progress.stats.maxWeight')}: ${formatWeight(selectedSession.maxWeightKg, unit, language)}`
                  : null}
            </span>
          </div>

          <div className="font-mono text-sm text-foreground">{selectedSession.setsText}</div>

          {selectedSession.dayNote ? (
            <div
              className="mt-1 flex items-start gap-1.5 text-xs italic text-muted border-l-2 border-primary pl-2.5 py-0.5"
              data-testid="selected-session-note"
            >
              <span>📝</span>
              <span>"{selectedSession.dayNote}"</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Historial textual completo desplegable */}
      <div className="border-t border-border pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {t('progress.history.title')} ({history.length})
          </span>
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className={buttonClassName('ghost', 'text-xs py-1 px-2 h-auto')}
          >
            {showHistory ? t('progress.history.hideHistory') : t('progress.history.showHistory')}
          </button>
        </div>

        {showHistory ? (
          <ul
            className="flex flex-col gap-2 font-mono text-sm"
            data-testid={`history-${exercise.exerciseId}`}
          >
            {history.map((sess) => (
              <li
                key={`${sess.workoutId}-${sess.sessionNumber}`}
                className="flex flex-col gap-1 rounded bg-surface/50 p-2 border border-border/50"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-foreground">{sess.label}: </span>
                    <span className="text-foreground">{sess.setsText}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-sans text-muted">
                    {sess.hasNote ? (
                      <span
                        className="inline-flex items-center gap-1 text-primary font-medium"
                        title={sess.dayNote ?? ''}
                        data-testid="note-mark"
                      >
                        📝 {t('progress.history.note')}
                      </span>
                    ) : null}
                    <span>{formatDate(sess.performedOn, language)}</span>
                  </div>
                </div>

                {sess.hasNote && sess.dayNote ? (
                  <div
                    className="font-sans text-xs italic text-muted mt-1 bg-surface-raised/80 rounded px-2 py-1 border-l-2 border-primary"
                    data-testid="session-note"
                  >
                    "{sess.dayNote}"
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
