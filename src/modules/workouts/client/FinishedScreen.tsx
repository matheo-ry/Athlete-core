import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Icon, StateOrbit, buttonClassName } from '@/core/ui';

import type { ActiveWorkout } from '../model/active-workout';
import { finishedSummary } from '../model/close-workout';
import { formatDuration } from '../model/workout-format';

/**
 * El resumen final de un entreno recién cerrado (D-119): duración, series
 * hechas y ejercicios, en tres cifras grandes. Es el momento de celebrarlo.
 * Los récords y los minilogros llegan en los PR 3.15 y 3.17.
 */
export function FinishedScreen({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const summary = finishedSummary(workout);
  const isCompleted = workout.closeReason === 'completed';
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
    <div className="flex flex-col items-center gap-6 pt-4 text-center">
      <StateOrbit>
        <Icon name={isCompleted ? 'trophy' : 'check'} className="text-primary-readable size-7" />
      </StateOrbit>
      <h1 className="text-3xl leading-[1.08] font-semibold">
        {isCompleted ? t('workouts.finished.titleCompleted') : t('workouts.finished.title')}
      </h1>
      <dl className="grid w-full grid-cols-3 gap-2">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className="surface animate-rise flex flex-col gap-2 rounded-2xl px-2 py-4"
            style={{ '--rise-delay': `${String(150 + index * 90)}ms` } as CSSProperties}
          >
            <dt className="eyebrow">{row.label}</dt>
            <dd className="numeric text-xl font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      <Link to="/client" replace className={buttonClassName('primary', 'w-full', 'lg')}>
        {t('workouts.finished.done')}
      </Link>
    </div>
  );
}
