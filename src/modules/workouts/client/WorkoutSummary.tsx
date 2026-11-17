import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { Button, Card } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import { useSaveActiveWorkout } from '../api/useActiveWorkout';
import { finishWorkout, setCounts } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { SetsRing } from './SetsRing';

/**
 * El resumen del día (D-120): cada ejercicio con su anillo de series hechas
 * ("1/3"), el total ("6/20 series") y "Terminar entreno". El cierre completo
 * (cierre solo y resumen) llega en el PR 3.6: de momento cierra y vuelve al inicio.
 */
export function WorkoutSummary({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const options = useExerciseOptions();
  const save = useSaveActiveWorkout();
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
      <Button
        variant="secondary"
        className="self-start"
        disabled={save.isPending}
        onClick={() => {
          void save
            .mutateAsync(finishWorkout(workout, new Date().toISOString()))
            .then(() => navigate('/client'));
        }}
      >
        {t('workouts.workout.finish')}
      </Button>
    </div>
  );
}
