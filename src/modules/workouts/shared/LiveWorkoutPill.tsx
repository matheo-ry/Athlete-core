import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { ProgressRing } from '@/core/ui';

import { useActiveWorkout } from '../api/useActiveWorkout';
import { useRestTimer } from '../api/rest-timer-store';
import { setCounts } from '../model/active-workout';

/**
 * "Entreno en curso" (D-prime2-6): con un entreno abierto y fuera de su
 * pantalla, una píldora de cristal encima de la barra de navegación lleva de
 * vuelta al último ejercicio que se tocó. No sale en el inicio (allí ya está
 * "Continuar entreno") ni mientras corre un descanso (sale su propia píldora).
 */
export function LiveWorkoutPill() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const workout = useActiveWorkout().data ?? null;
  const timer = useRestTimer();

  const hidden =
    workout === null ||
    !pathname.startsWith('/client/') ||
    pathname.startsWith('/client/workout') ||
    (timer !== null && timer.workoutId === workout.id);
  if (hidden) {
    return null;
  }
  const counts = setCounts(workout.exercises);

  return (
    <Link
      to={`/client/workout?exercise=${String(workout.lastExercise)}`}
      className="glass-float focus-ring animate-enter fixed inset-x-0 bottom-[calc(6.25rem+var(--safe-bottom))] z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5"
    >
      <ProgressRing value={counts.done} max={counts.total} size={36} stroke={3.5}>
        <span
          aria-hidden="true"
          className="bg-primary block size-2 animate-pulse rounded-full shadow-[0_0_10px_2px_var(--color-primary-glow)]"
        />
      </ProgressRing>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold">{t('workouts.today.continue')}</span>
        <span className="text-muted text-xs tabular-nums">
          {t('workouts.workout.totalSets', counts)}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="text-muted size-4 shrink-0" />
    </Link>
  );
}
