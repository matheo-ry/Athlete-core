import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { canLogWorkouts } from '@/core/native';
import { Button, Card, EmptyState, ErrorState, Spinner, buttonClassName } from '@/core/ui';
import { useClientToday, useDayTitle } from '@/modules/programs';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { useStartWorkout } from '../api/useStartWorkout';
import { ExerciseScreen } from './ExerciseScreen';
import { WorkoutSummary } from './WorkoutSummary';

/**
 * `/client/workout` (D-119, D-120): con un entreno abierto, su resumen o, con
 * `?exercise=N`, ese ejercicio. Sin entreno, `?day=N` ofrece empezar ese día.
 * Solo en la app del móvil (D-116).
 */
export function WorkoutPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const active = useActiveWorkout();

  if (!canLogWorkouts()) {
    return <EmptyState title={t('workouts.today.openMobileApp')} />;
  }
  if (active.isPending) {
    return <Spinner />;
  }
  if (active.isError) {
    return <ErrorState title={t('workouts.workout.loadError')} />;
  }
  const workout = active.data;
  if (workout === null) {
    return <StartDay dayNumber={Number(params.get('day'))} />;
  }
  const exercise = Number(params.get('exercise'));
  return Number.isInteger(exercise) && exercise >= 1 && exercise <= workout.exercises.length ? (
    <ExerciseScreen workout={workout} position={exercise} />
  ) : (
    <WorkoutSummary workout={workout} />
  );
}

/** Empezar el entreno de un día desde "Entreno" (D-119). */
function StartDay({ dayNumber }: { dayNumber: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = useClientToday();
  const title = useDayTitle(today.status === 'ready' ? today.block : undefined);
  const starter = useStartWorkout();

  if (today.status === 'loading') {
    return <Spinner />;
  }
  const day =
    today.status === 'ready'
      ? today.block.days.find((item) => item.dayNumber === dayNumber && item.kind === 'training')
      : undefined;
  if (today.status !== 'ready' || day === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState title={t('workouts.workout.noWorkout')} />
        <Link to="/client/program" className={buttonClassName('ghost', 'self-start')}>
          {t('workouts.workout.toProgram')}
        </Link>
      </div>
    );
  }
  return (
    <Card className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">{title(day)}</h1>
      <Button
        className="self-start"
        disabled={!starter.isReady || starter.isPending}
        onClick={() => {
          void starter.start(today.program.id, today.block, day).then(() => {
            void navigate('/client/workout', { replace: true });
          });
        }}
      >
        {t('workouts.today.start')}
      </Button>
    </Card>
  );
}
