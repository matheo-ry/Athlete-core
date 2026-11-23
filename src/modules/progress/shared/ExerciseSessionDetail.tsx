import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate, formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';
import { Icon } from '@/core/ui';

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
      className="surface-raised flex flex-col gap-2.5 rounded-2xl p-3.5"
      data-testid="selected-workout-detail"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{session.label}</span>
          <span className="text-muted text-xs">{formatDate(session.performedOn, language)}</span>
        </div>
        {metricText ? (
          <span className="numeric text-primary-readable text-xs font-medium">{metricText}</span>
        ) : null}
      </div>

      <div className="numeric text-base">{session.setsText}</div>

      {session.dayNote ? (
        <div
          className="border-accent text-muted flex items-start gap-2 border-l-2 pl-2.5 text-sm leading-6"
          data-testid="selected-session-note"
        >
          <Icon name="note" className="mt-1 size-3.5 shrink-0" />
          <span>“{session.dayNote}”</span>
        </div>
      ) : null}
    </div>
  );
}
