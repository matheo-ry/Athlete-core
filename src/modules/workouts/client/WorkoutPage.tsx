import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { canLogWorkouts } from '@/core/native';
import {
  BackLink,
  Button,
  Card,
  EmptyState,
  ErrorState,
  HeroBackdrop,
  Spinner,
  buttonClassName,
  photoFor,
} from '@/core/ui';
import { useClientToday, useDayTitle } from '@/modules/programs';

import { useActiveWorkout, useFinishedWorkout } from '../api/useActiveWorkout';
import { useStartWorkout } from '../api/useStartWorkout';
import { useWorkoutOwnership } from '../api/useWorkoutOwnership';
import type { ActiveWorkout } from '../model/active-workout';
import { isComplete } from '../model/close-workout';
import { ExerciseScreen } from './ExerciseScreen';
import { FinishedScreen } from './FinishedScreen';
import { OtherDeviceNotice } from './OtherDeviceNotice';
import { useAutoClose } from './useCloseWorkout';
import { WorkoutSummary } from './WorkoutSummary';

/**
 * `/client/workout` (D-119, D-120): con un entreno abierto, su resumen o, con
 * `?exercise=N`, ese ejercicio. Sin entreno, `?day=N` ofrece empezar ese día
 * y `?finished=<id>` enseña el resumen final del recién cerrado. Solo en la
 * app del móvil (D-116).
 */
export function WorkoutPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const active = useActiveWorkout();
  const finished = useFinishedWorkout(params.get('finished'));
  const ownership = useWorkoutOwnership();

  if (!canLogWorkouts()) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink to="/client">{t('workouts.workout.leave')}</BackLink>
        <EmptyState title={t('workouts.today.openMobileApp')} />
      </div>
    );
  }
  if (active.isPending) {
    return <Spinner />;
  }
  if (active.isError) {
    return <ErrorState title={t('workouts.workout.loadError')} />;
  }
  const workout = active.data;
  if (workout === null) {
    if (finished.data) {
      return <FinishedScreen workout={finished.data} />;
    }
    return ownership.kind === 'elsewhere' ? (
      <OtherDeviceNotice remote={ownership.remote} local={null} />
    ) : (
      <StartDay dayNumber={Number(params.get('day'))} />
    );
  }
  if (ownership.kind === 'taken') {
    return <OtherDeviceNotice remote={ownership.remote} local={workout} />;
  }
  const exercise = Number(params.get('exercise'));
  return (
    <OpenWorkout
      workout={workout}
      position={
        Number.isInteger(exercise) && exercise >= 1 && exercise <= workout.exercises.length
          ? exercise
          : null
      }
    />
  );
}

/** El entreno abierto: el resumen o un ejercicio, y el cierre solo (D-149). */
function OpenWorkout({ workout, position }: { workout: ActiveWorkout; position: number | null }) {
  const { t } = useTranslation();
  useAutoClose(workout, position === null);
  if (position === null) {
    return <WorkoutSummary workout={workout} />;
  }
  return (
    <div className="flex flex-col gap-4">
      {isComplete(workout) ? (
        <Card role="status" tone="float" className="animate-enter flex flex-col gap-3">
          <p className="font-semibold">{t('workouts.finished.allDone')}</p>
          <Link to="?" replace className={buttonClassName('primary', 'w-full', 'lg')}>
            {t('workouts.finished.seeSummary')}
          </Link>
        </Card>
      ) : null}
      <ExerciseScreen workout={workout} position={position} />
    </div>
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
        <Link to="/client/program" className={buttonClassName('secondary', 'self-center')}>
          {t('workouts.workout.toProgram')}
        </Link>
      </div>
    );
  }
  return (
    <>
      <HeroBackdrop photo={photoFor(day.dayNumber)} />
      <div className="flex min-h-[calc(100svh-var(--safe-top)-4rem)] flex-col gap-6">
        <BackLink to="/client/program" tone="photo">
          {t('workouts.workout.toProgram')}
        </BackLink>
        <div className="mt-auto flex flex-col gap-6">
          <h1 className="display text-on-photo animate-enter text-[3.2rem] break-words">
            {title(day)}
          </h1>
          <Button
            size="lg"
            className="w-full"
            disabled={!starter.isReady || starter.isPending}
            onClick={() => {
              void starter.start(today.program.id, today.block, day).then(() => {
                void navigate('/client/workout', { replace: true });
              });
            }}
          >
            {t('workouts.today.start')}
          </Button>
        </div>
      </div>
    </>
  );
}
