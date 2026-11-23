import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { HeroBackdrop, buttonClassName, enterDelay } from '@/core/ui';

import type { ActiveWorkout } from '../model/active-workout';
import { finishedSummary } from '../model/close-workout';
import { formatDuration } from '../model/workout-format';

/**
 * El resumen final de un entreno recién cerrado (D-119): duración, series
 * hechas y ejercicios, a lo grande y sobre una foto, como un marcador al
 * acabar (D-prime2-5). Los récords y los minilogros llegan en los PR 3.15 y 3.17.
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
    <>
      <HeroBackdrop photo="chalk" size="screen" />
      <div className="over-photo flex min-h-[calc(100svh-var(--safe-top)-4rem)] flex-col justify-end gap-8">
        <h1 className="display text-on-photo animate-enter text-[3.4rem]">
          {workout.closeReason === 'completed'
            ? t('workouts.finished.titleCompleted')
            : t('workouts.finished.title')}
        </h1>
        <dl className="grid grid-cols-2 gap-3">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className="glass-photo animate-enter flex flex-col gap-2 rounded-[1.6rem] p-5 first:col-span-2"
              style={enterDelay(120 + index * 90)}
            >
              <dt className="eyebrow text-on-photo-muted">{row.label}</dt>
              <dd className="numeral text-on-photo text-4xl">{row.value}</dd>
            </div>
          ))}
        </dl>
        <Link to="/client" replace className={buttonClassName('primary', 'w-full', 'lg')}>
          {t('workouts.finished.done')}
        </Link>
      </div>
    </>
  );
}
