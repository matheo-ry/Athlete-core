import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { BackLink, Button, Card, ProgressRing, ROW_LINK_CLASS } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import { useDiscardActiveWorkout } from '../api/useActiveWorkout';
import { setCounts } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { isComplete } from '../model/close-workout';
import { SetsRing } from './SetsRing';
import { useCloseWorkout } from './useCloseWorkout';

/**
 * El resumen del día (D-120): el anillo grande con las series de todo el día,
 * cada ejercicio con su anillo ("1/3"), "Terminar entreno" y "Descartar
 * entreno" con confirmación (D-119). "Salir por ahora" vuelve al inicio con el
 * entreno abierto: en el entreno no hay barra de navegación (D-prime2-1).
 */
export function WorkoutSummary({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const options = useExerciseOptions();
  const closer = useCloseWorkout();
  const total = setCounts(workout.exercises);
  const complete = isComplete(workout);

  return (
    <div className="flex flex-col gap-6">
      <BackLink to="/client">{t('workouts.workout.leave')}</BackLink>
      <header className="animate-enter flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="display text-[2.4rem]">{t('workouts.workout.title')}</h1>
          <p className="text-muted text-base font-medium tabular-nums">
            {t('workouts.workout.totalSets', total)}
          </p>
        </div>
        <ProgressRing value={total.done} max={total.total} size={96} stroke={8}>
          <span className="numeral text-2xl">
            {total.total === 0 ? 0 : Math.round((total.done / total.total) * 100)}
            <span className="text-muted text-sm">%</span>
          </span>
        </ProgressRing>
      </header>
      <Card className="p-2">
        <ol aria-label={t('workouts.workout.exercisesLabel')} className="flex flex-col">
          {workout.exercises.map((exercise) => {
            const counts = setCounts([exercise]);
            return (
              <li key={exercise.id}>
                <Link to={`?exercise=${String(exercise.position)}`} className={ROW_LINK_CLASS}>
                  <SetsRing done={counts.done} total={counts.total} />
                  <span className="min-w-0 flex-1 font-semibold break-words">
                    {options.byId.get(exercise.exerciseId)?.name ?? '…'}
                  </span>
                  <ChevronRight aria-hidden="true" className="text-muted size-5 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ol>
      </Card>
      <Button
        size="lg"
        variant={complete ? 'primary' : 'secondary'}
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

/** "Descartar entreno", con confirmación: lo borra con todo lo apuntado (D-119). */
function DiscardWorkout({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const discard = useDiscardActiveWorkout();
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <Button
        variant="ghost"
        className="text-muted hover:text-danger self-center"
        onClick={() => setIsConfirming(true)}
      >
        {t('workouts.discard.button')}
      </Button>
    );
  }
  return (
    <div role="alert" className="bg-danger-soft flex flex-col gap-3 rounded-[1.6rem] p-5">
      <p className="text-sm font-medium">{t('workouts.discard.confirm')}</p>
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
