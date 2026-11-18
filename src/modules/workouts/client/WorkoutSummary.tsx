import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { Button, Card } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import { useDiscardActiveWorkout } from '../api/useActiveWorkout';
import { setCounts } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { SetsRing } from './SetsRing';
import { useCloseWorkout } from './useCloseWorkout';

/**
 * El resumen del día (D-120): cada ejercicio con su anillo de series hechas
 * ("1/3"), el total ("6/20 series"), "Terminar entreno" y "Descartar entreno"
 * con confirmación (D-119).
 */
export function WorkoutSummary({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const options = useExerciseOptions();
  const closer = useCloseWorkout();
  const total = setCounts(workout.exercises);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold">{t('workouts.workout.title')}</h1>
        <p className="font-semibold">{t('workouts.workout.totalSets', total)}</p>
      </header>
      <Card>
        <ol aria-label={t('workouts.workout.exercisesLabel')}>
          {workout.exercises.map((exercise) => {
            const counts = setCounts([exercise]);
            return (
              <li key={exercise.id} className="border-border border-b last:border-b-0">
                <Link
                  to={`?exercise=${String(exercise.position)}`}
                  className="hover:bg-background focus-visible:outline-primary-readable flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 focus-visible:outline-2"
                >
                  <SetsRing done={counts.done} total={counts.total} />
                  <span className="font-medium">
                    {options.byId.get(exercise.exerciseId)?.name ?? '…'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={closer.isPending}
          onClick={() => void closer.close(workout, 'manual')}
        >
          {t('workouts.workout.finish')}
        </Button>
      </div>
      <DiscardWorkout workout={workout} />
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
      <Button variant="ghost" className="self-start" onClick={() => setIsConfirming(true)}>
        {t('workouts.discard.button')}
      </Button>
    );
  }
  return (
    <div role="alert" className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-sm">{t('workouts.discard.confirm')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
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
