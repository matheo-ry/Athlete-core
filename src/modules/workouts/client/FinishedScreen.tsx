import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card, buttonClassName } from '@/core/ui';

import type { ActiveWorkout } from '../model/active-workout';
import { finishedSummary } from '../model/close-workout';
import { formatDuration } from '../model/workout-format';

/**
 * El resumen final de un entreno recién cerrado (D-119): duración, series
 * hechas y ejercicios. Los récords y los minilogros llegan en los PR 3.15 y 3.17.
 */
export function FinishedScreen({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const summary = finishedSummary(workout);
  const rows = [
    { label: t('workouts.finished.duration'), value: formatDuration(summary.minutes) },
    { label: t('workouts.finished.sets'), value: String(summary.setsDone) },
    {
      label: t('workouts.finished.exercises'),
      value: t('workouts.finished.exercisesValue', {
        done: summary.exercisesDone,
        total: summary.exercisesTotal,
      }),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {workout.closeReason === 'completed'
          ? t('workouts.finished.titleCompleted')
          : t('workouts.finished.title')}
      </h1>
      <Card>
        <dl className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <dt className="text-muted">{row.label}</dt>
              <dd className="text-lg font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Link to="/client" replace className={buttonClassName('primary', 'self-start')}>
        {t('workouts.finished.done')}
      </Link>
    </div>
  );
}
