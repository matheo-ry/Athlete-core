import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate, formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';

import type { ExerciseSessionHistory } from '../model/exercise-history';
import type { ExerciseChartMetric } from '../model/progress-charts';

interface ExerciseSessionDetailProps {
  session: ExerciseSessionHistory;
  metric: ExerciseChartMetric;
  unit: WeightUnit;
}

/** Detalle del entreno elegido en la gráfica: día, fecha, series y nota del día. */
export function ExerciseSessionDetail({ session, metric, unit }: ExerciseSessionDetailProps) {
  const { t } = useTranslation();
  const language = useLanguage();

  let metricText: string | null = null;
  if (metric === 'estimated_rm' && session.maxRm != null) {
    metricText = `${t('progress.stats.estimatedRm')}: ${formatWeight(session.maxRm, unit, language)}`;
  } else if (metric === 'max_weight' && session.maxWeightKg != null) {
    metricText = `${t('progress.stats.maxWeight')}: ${formatWeight(session.maxWeightKg, unit, language)}`;
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3"
      data-testid="selected-workout-detail"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{session.label}</span>
          <span className="text-xs text-muted">{formatDate(session.performedOn, language)}</span>
        </div>
        {metricText ? (
          <span className="font-mono text-xs font-bold text-primary-readable">{metricText}</span>
        ) : null}
      </div>

      <div className="font-mono text-sm text-foreground">{session.setsText}</div>

      {session.dayNote ? (
        <div
          className="mt-1 flex items-start gap-1.5 border-l-2 border-primary py-0.5 pl-2.5 text-xs text-muted italic"
          data-testid="selected-session-note"
        >
          <span aria-hidden="true">📝</span>
          <span>"{session.dayNote}"</span>
        </div>
      ) : null}
    </div>
  );
}
