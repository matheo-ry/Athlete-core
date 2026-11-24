import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { cn } from '@/core/lib';
import { useTenantSettings } from '@/core/tenancy';
import { Button, Icon } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import { useDiscardActiveWorkout } from '../api/useActiveWorkout';
import { useWorkoutMiniAchievements } from '../api/useWorkoutMiniAchievements';
import { setCounts } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { groupLabel } from '../model/superset-rounds';
import { SetsRing } from './SetsRing';
import { useCloseWorkout } from './useCloseWorkout';

/** Con más series que esto, la barra es continua: los segmentos ya no se distinguen. */
const MAX_SEGMENTS = 36;

/**
 * El resumen del día (D-120): el total ("6/20 series") con una barra de una
 * casilla por serie, cada ejercicio con su anillo ("1/3"), "Terminar entreno" y
 * "Descartar entreno" con confirmación (D-119).
 */
export function WorkoutSummary({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const { achievementsEnabled } = useTenantSettings();
  const options = useExerciseOptions();
  const closer = useCloseWorkout();
  const total = setCounts(workout.exercises);
  const miniAchievementsCount = useWorkoutMiniAchievements(workout);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl leading-[1.08] font-semibold">{t('workouts.workout.title')}</h1>
        <div className="surface flex flex-col gap-3 rounded-3xl p-4">
          <p className="numeric text-2xl font-medium">{t('workouts.workout.totalSets', total)}</p>
          {achievementsEnabled && miniAchievementsCount > 0 ? (
            <div
              data-testid="summary-mini-achievements"
              className="flex items-center gap-1.5 text-sm font-medium text-amber-500"
            >
              <Icon name="sparkles" className="size-4 shrink-0" />
              <span>
                {t('workouts.workout.miniAchievementsCount', { count: miniAchievementsCount })}
              </span>
            </div>
          ) : null}
          <SetsBar done={total.done} total={total.total} />
        </div>
      </header>
      <ol aria-label={t('workouts.workout.exercisesLabel')} className="flex flex-col gap-2">
        {workout.exercises.map((exercise) => {
          const counts = setCounts([exercise]);
          const group = groupLabel(workout, exercise.position);
          const nameOf = (id: string) => options.byId.get(id)?.name ?? '…';
          return (
            <li key={exercise.id}>
              <Link
                to={`?exercise=${String(exercise.position)}`}
                className="surface focus-ring group flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2 transition-transform active:scale-[0.99]"
              >
                <SetsRing done={counts.done} total={counts.total} />
                <span className="flex min-w-0 flex-1 flex-col">
                  {group === null ? null : (
                    <span className="eyebrow text-primary-readable">
                      {t(`workouts.workout.group.${group.kind}`, {
                        position: group.position,
                        size: group.size,
                      })}
                    </span>
                  )}
                  {/* El título es el de la rutina; lo que se hizo en su lugar, debajo (D-122). */}
                  <span className="font-medium">
                    {nameOf(exercise.replacesExerciseId ?? exercise.exerciseId)}
                  </span>
                  {exercise.replacesExerciseId === null ? null : (
                    <span className="text-muted text-sm">
                      {t('workouts.workout.replacedBy', { name: nameOf(exercise.exerciseId) })}
                    </span>
                  )}
                  {exercise.isSkipped ? (
                    <span className="text-muted text-sm">{t('workouts.workout.skippedTag')}</span>
                  ) : null}
                </span>
                <Icon
                  name="chevronRight"
                  className="text-muted size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          );
        })}
      </ol>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={closer.isPending}
        onClick={() => void closer.close(workout, 'manual')}
      >
        {t('workouts.workout.finish')}
      </Button>
      <DiscardWorkout workout={workout} />
    </div>
  );
}

/** Una casilla por serie, encendidas las hechas: el entreno de un vistazo. */
function SetsBar({ done, total }: { done: number; total: number }) {
  if (total === 0) {
    return null;
  }
  if (total > MAX_SEGMENTS) {
    return (
      <div aria-hidden="true" className="bg-foreground/10 h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-500"
          style={{ width: `${String((done / total) * 100)}%` }}
        />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="flex gap-[3px]">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-2.5 flex-1 rounded-[3px] transition-colors duration-300',
            index < done ? 'bg-primary' : 'bg-foreground/10',
          )}
        />
      ))}
    </div>
  );
}

/** "Descartar entreno", con confirmación: lo borra con todo lo apuntado (D-119). */
function DiscardWorkout({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const discard = useDiscardActiveWorkout();
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        className="focus-ring text-muted hover:text-danger min-h-11 self-center rounded-full px-5 text-sm font-semibold transition-colors"
        onClick={() => setIsConfirming(true)}
      >
        {t('workouts.discard.button')}
      </button>
    );
  }
  return (
    <div
      role="alert"
      className="border-danger/40 bg-danger-soft animate-rise flex flex-col gap-3 rounded-3xl border p-4"
    >
      <p className="text-sm leading-6">{t('workouts.discard.confirm')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={discard.isPending}
          onClick={() => {
            void discard.mutateAsync(workout).then(() => navigate('/client', { replace: true }));
          }}
        >
          {t('workouts.discard.yes')}
        </Button>
        <Button variant="ghost" onClick={() => setIsConfirming(false)}>
          {t('workouts.discard.cancel')}
        </Button>
      </div>
    </div>
  );
}
