import { ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { cn } from '@/core/lib';
import { BackLink, buttonClassName } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import { useSaveActiveWorkout } from '../api/useActiveWorkout';
import { useRestControls } from '../api/useRestControls';
import { usePreviousPerformance } from '../api/usePreviousPerformance';
import {
  MAX_SETS,
  addSet,
  changeSet,
  copyPrevious,
  copySource,
  previousSet,
  setCounts,
  unmarkSet,
} from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { SetEditor } from './SetEditor';

/** Lo que hay que deslizar, en píxeles, para pasar de ejercicio. */
const SWIPE = 60;

/**
 * Un ejercicio por pantalla (D-120): su nombre, "Ejercicio 3 de 7" con la
 * fila de puntos, deslizar al siguiente o al anterior, y sus series. Cada
 * cambio se guarda en el móvil al instante y va a la cola de subida (D-118).
 */
export function ExerciseScreen({
  workout,
  position,
}: {
  workout: ActiveWorkout;
  position: number;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const options = useExerciseOptions();
  const save = useSaveActiveWorkout();
  const rest = useRestControls();
  const touchStart = useRef<number | null>(null);
  const exercise = workout.exercises[position - 1];
  const previous = usePreviousPerformance(exercise?.exerciseId ?? '', workout.dayNumber);
  const now = () => new Date().toISOString();
  if (exercise === undefined) {
    return null;
  }
  const count = workout.exercises.length;
  const go = (to: number) => {
    if (to >= 1 && to <= count) {
      void navigate(`?exercise=${String(to)}`, { replace: true });
    }
  };

  return (
    <div
      className="flex flex-col gap-6"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        touchStart.current = null;
        if (start !== null && end !== undefined && Math.abs(end - start) > SWIPE) {
          go(end < start ? position + 1 : position - 1);
        }
      }}
    >
      <BackLink to="?">{t('workouts.workout.toSummary')}</BackLink>
      <header className="animate-enter flex flex-col gap-3">
        <p className="eyebrow text-muted">
          {t('workouts.workout.exerciseOf', { number: position, count })}
        </p>
        {/* Una raya por ejercicio: llena si está hecho, encendida la de ahora. */}
        <nav aria-label={t('workouts.workout.exercisesLabel')} className="flex gap-1">
          {workout.exercises.map((item) => {
            const counts = setCounts([item]);
            const isDone = counts.total > 0 && counts.done === counts.total;
            return (
              <Link
                key={item.id}
                to={`?exercise=${String(item.position)}`}
                replace
                aria-label={t('workouts.workout.goTo', { number: item.position })}
                aria-current={item.position === position ? 'step' : undefined}
                className="focus-ring flex h-11 min-w-0 flex-1 items-center rounded-full"
              >
                <span
                  className={cn(
                    'h-1.5 w-full rounded-full transition-[background-color,box-shadow] duration-500',
                    item.position === position
                      ? 'bg-primary shadow-[0_0_12px_1px_var(--color-primary-glow)]'
                      : isDone
                        ? 'bg-primary/45'
                        : 'bg-hairline-strong',
                  )}
                />
              </Link>
            );
          })}
        </nav>
        <h1 className="display text-[2.5rem] break-words">
          {options.byId.get(exercise.exerciseId)?.name ?? '…'}
        </h1>
        {exercise.coachNote === null ? null : (
          <p className="glass flex gap-3 rounded-2xl px-4 py-3 text-sm leading-relaxed">
            <MessageSquareQuote
              aria-hidden="true"
              className="text-primary-readable mt-0.5 size-4 shrink-0"
            />
            <span>{exercise.coachNote}</span>
          </p>
        )}
      </header>
      <ol className="flex flex-col gap-3">
        {exercise.sets.map((set) => {
          const before = previousSet(previous, set.setNumber);
          const source = copySource(rest.sameButton, exercise, set.setNumber, before);
          // Solo el primer cambio de una serie (o "Igual") arranca el descanso (D-123).
          const startRest = () => {
            rest.afterSet({
              workoutId: workout.id,
              coachSeconds: exercise.restSeconds,
              wasDone: set.isDone,
            });
          };
          return (
            <SetEditor
              key={set.id}
              exercise={exercise}
              set={set}
              previous={before}
              copySource={source}
              onCopy={() => {
                if (source !== null) {
                  save.mutate(copyPrevious(workout, position, set.setNumber, source, now()));
                  startRest();
                }
              }}
              onUnmark={() => {
                save.mutate(unmarkSet(workout, position, set.setNumber, now()));
              }}
              onChange={(patch) => {
                save.mutate(
                  changeSet(workout, position, set.setNumber, patch, new Date().toISOString()),
                );
                startRest();
              }}
            />
          );
        })}
      </ol>
      {exercise.sets.length >= MAX_SETS ? null : (
        <button
          type="button"
          className={buttonClassName(
            'ghost',
            'w-full border border-dashed border-hairline-strong',
            'lg',
          )}
          onClick={() => {
            save.mutate(addSet(workout, position, now(), () => crypto.randomUUID()));
          }}
        >
          {t('workouts.set.add')}
        </button>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={buttonClassName('secondary', 'justify-start! pl-3!', 'lg')}
          disabled={position === 1}
          onClick={() => {
            go(position - 1);
          }}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          {t('workouts.workout.previous')}
        </button>
        <button
          type="button"
          className={buttonClassName('primary', 'justify-end! pr-3!', 'lg')}
          disabled={position === count}
          onClick={() => {
            go(position + 1);
          }}
        >
          {t('workouts.workout.next')}
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
