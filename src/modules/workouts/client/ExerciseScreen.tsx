import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { useProfile } from '@/core/auth';
import { cn } from '@/core/lib';
import { useHealthConsent, useHealthConsentPrompt } from '@/core/tenancy';
import { Icon, buttonClassName } from '@/core/ui';
import { ExercisePicker, useExerciseOptions } from '@/modules/exercises';

import { useSaveActiveWorkout } from '../api/useActiveWorkout';
import { useExerciseSetups } from '../api/useExerciseSetups';
import { useRestControls } from '../api/useRestControls';
import { usePreviousPerformance } from '../api/usePreviousPerformance';
import {
  MAX_SETS,
  addSet,
  addWarmupSet,
  changeSet,
  changeWarmupSet,
  copySides,
  copySource,
  previousSet,
  removeWarmupSet,
  setCounts,
  setDayNote,
  setNumbers,
  sidesOf,
  unmarkSet,
} from '../model/active-workout';
import type { ActiveWorkout, PreviousSetValues, Side } from '../model/active-workout';
import { canSkip, replaceExercise, skipExercise, unskipExercise } from '../model/exercise-actions';
import {
  ADVANCE_AFTER_COPY_MS,
  ADVANCE_DELAY_MS,
  advanceTarget,
  completesRound,
  groupLabel,
} from '../model/superset-rounds';
import { ExerciseActions, SkippedNotice } from './ExerciseActions';
import { SetEditor } from './SetEditor';
import type { BySide } from './SetEditor';
import { WarmupSection } from './WarmupSection';

/** Lo que hay que deslizar, en píxeles, para pasar de ejercicio. */
const SWIPE = 60;

/** Pasar solo al siguiente del grupo, cuando pasen `delay` ms sin tocar nada. */
interface PendingAdvance {
  from: number;
  to: number;
  delay: number;
  /** Cada cambio lo renueva: la cuenta vuelve a empezar. */
  version: number;
}

/**
 * Un ejercicio por pantalla (D-120): su nombre, "Ejercicio 3 de 7" con la
 * barra de ejercicios (hechos, el actual y los que faltan), deslizar al
 * siguiente o al anterior, y sus series. Cada cambio se guarda en el móvil al
 * instante y va a la cola de subida (D-118). En una superserie o un circuito,
 * al acabar la serie pasa al siguiente del grupo (D-121).
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
  const [picking, setPicking] = useState(false);
  const [advance, setAdvance] = useState<PendingAdvance | null>(null);
  const exercise = workout.exercises[position - 1];
  const previous = usePreviousPerformance(exercise?.exerciseId ?? '', workout.dayNumber);
  const { ensure } = useHealthConsentPrompt();
  const { isGranted } = useHealthConsent();
  const { setups, saveSetup } = useExerciseSetups();
  const warmupSetsEnabled = useProfile().data?.warmupSetsEnabled ?? false;

  const instructions = options.byId.get(exercise?.exerciseId ?? '')?.instructions ?? null;
  const currentSetup = setups[exercise?.exerciseId ?? ''] ?? '';
  const [setupDraft, setSetupDraft] = useState(currentSetup);
  const [prevSetup, setPrevSetup] = useState(currentSetup);
  if (currentSetup !== prevSetup) {
    setPrevSetup(currentSetup);
    setSetupDraft(currentSetup);
  }

  const [noteDraft, setNoteDraft] = useState(exercise?.dayNote ?? '');
  const [prevExerciseId, setPrevExerciseId] = useState(exercise?.id);
  const [prevDayNote, setPrevDayNote] = useState(exercise?.dayNote);
  if (exercise?.id !== prevExerciseId || exercise?.dayNote !== prevDayNote) {
    setPrevExerciseId(exercise?.id);
    setPrevDayNote(exercise?.dayNote);
    setNoteDraft(exercise?.dayNote ?? '');
  }

  const now = () => new Date().toISOString();

  useEffect(() => {
    if (advance === null || advance.from !== position) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setAdvance(null);
      void navigate(`?exercise=${String(advance.to)}`, { replace: true });
    }, advance.delay);
    return () => {
      clearTimeout(timer);
    };
  }, [advance, position, navigate]);

  if (exercise === undefined) {
    return null;
  }
  const count = workout.exercises.length;
  const go = (to: number) => {
    if (to >= 1 && to <= count) {
      void navigate(`?exercise=${String(to)}`, { replace: true });
    }
  };
  const nameOf = (id: string) => options.byId.get(id)?.name ?? '…';
  const group = groupLabel(workout, position);

  /** Guarda el cambio, arranca el descanso si acaba la ronda y decide a dónde seguir. */
  const apply = (next: ActiveWorkout, setNumber: number, delay: number) => {
    save.mutate(next);
    rest.afterSet({
      workoutId: workout.id,
      coachSeconds: exercise.restSeconds,
      roundCompleted: completesRound(workout, next, position, setNumber),
    });
    const to = advanceTarget(workout, next, position, setNumber);
    setAdvance((current) =>
      to !== null
        ? { from: position, to, delay, version: (current?.version ?? 0) + 1 }
        : current !== null && current.from === position
          ? { ...current, version: current.version + 1 }
          : current,
    );
  };

  if (picking) {
    return (
      <ExercisePicker
        title={t('workouts.workout.replaceTitle', { name: nameOf(exercise.exerciseId) })}
        measurement={exercise.measurement}
        onCancel={() => {
          setPicking(false);
        }}
        onPick={(picked) => {
          save.mutate(
            replaceExercise(
              workout,
              position,
              {
                exerciseId: picked.id,
                measurement: picked.measurement,
                isUnilateral: picked.isUnilateral,
              },
              now(),
              () => crypto.randomUUID(),
            ),
          );
          setPicking(false);
        }}
      />
    );
  }

  return (
    <div
      className="flex flex-col gap-5"
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
      <div className="flex items-center justify-between gap-2">
        <Link to="?" className={buttonClassName('ghost', '-ml-3 pl-2')}>
          <Icon name="chevronLeft" className="size-5" />
          {t('workouts.workout.toSummary')}
        </Link>
        <p className="eyebrow">{t('workouts.workout.exerciseOf', { number: position, count })}</p>
      </div>
      <nav
        aria-label={t('workouts.workout.exercisesLabel')}
        className="-my-2 grid grid-cols-[repeat(auto-fit,minmax(2.75rem,1fr))] gap-x-1"
      >
        {workout.exercises.map((item) => {
          const counts = setCounts([item]);
          const isCurrent = item.position === position;
          const isDone = item.isSkipped || (counts.total > 0 && counts.done >= counts.total);
          return (
            <Link
              key={item.id}
              to={`?exercise=${String(item.position)}`}
              replace
              aria-label={t('workouts.workout.goTo', { number: item.position })}
              aria-current={isCurrent ? 'step' : undefined}
              className="focus-ring flex h-11 items-center rounded-md"
            >
              <span
                className={cn(
                  'h-1.5 w-full rounded-full transition-colors duration-300',
                  isCurrent
                    ? 'bg-primary shadow-[0_0_12px_var(--color-primary-glow)]'
                    : isDone
                      ? 'bg-primary/45'
                      : 'bg-foreground/12',
                )}
              />
            </Link>
          );
        })}
      </nav>
      <header className="flex flex-col gap-3">
        {group === null ? null : (
          <p className="eyebrow text-primary-readable" data-testid="group-label">
            {t(`workouts.workout.group.${group.kind}`, {
              position: group.position,
              size: group.size,
            })}
          </p>
        )}
        <h1 className="text-3xl leading-[1.08] font-semibold">{nameOf(exercise.exerciseId)}</h1>
        {exercise.replacesExerciseId === null ? null : (
          <p className="text-muted text-sm">
            {t('workouts.workout.replaces', { name: nameOf(exercise.replacesExerciseId) })}
          </p>
        )}
        {exercise.coachNote === null ? null : (
          <p
            className="border-accent text-muted border-l-2 pl-3 text-sm leading-6"
            data-testid="coach-note"
          >
            {exercise.coachNote}
          </p>
        )}
        {instructions !== null && instructions !== '' ? (
          <div
            className="border-border/60 bg-foreground/5 rounded-2xl p-3 text-sm leading-relaxed text-muted"
            data-testid="exercise-instructions"
          >
            <p className="eyebrow text-xs text-muted/80 mb-1">
              {t('workouts.exercise.instructions')}
            </p>
            <p>{instructions}</p>
          </div>
        ) : null}
        <div
          className="flex flex-col gap-1.5 rounded-2xl bg-foreground/5 p-3"
          data-testid="exercise-setup"
        >
          <label htmlFor={`setup-${exercise.id}`} className="eyebrow text-xs">
            {t('workouts.exercise.setup')}
          </label>
          <input
            id={`setup-${exercise.id}`}
            type="text"
            maxLength={500}
            aria-label={t('workouts.exercise.setup')}
            placeholder={t('workouts.exercise.setupPlaceholder')}
            className="focus-ring border-border bg-background/80 text-foreground h-10 w-full rounded-xl border px-3 text-sm outline-none"
            value={setupDraft}
            onChange={(e) => setSetupDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            onBlur={() => {
              if (setupDraft.trim() !== currentSetup.trim()) {
                void saveSetup(exercise.exerciseId, setupDraft);
              }
            }}
          />
          <span className="text-muted/60 text-xs">{t('workouts.exercise.setupHelp')}</span>
        </div>
      </header>
      {exercise.isSkipped ? (
        <SkippedNotice
          onUndo={() => {
            save.mutate(unskipExercise(workout, position, now()));
          }}
        />
      ) : (
        <>
          <WarmupSection
            exercise={exercise}
            previous={previous}
            enabled={warmupSetsEnabled}
            onAdd={() => {
              save.mutate(addWarmupSet(workout, position, now(), () => crypto.randomUUID()));
            }}
            onChange={(setNumber, patch) => {
              save.mutate(changeWarmupSet(workout, position, setNumber, patch, now()));
            }}
            onCopy={(setNumber, prev) => {
              save.mutate(
                changeWarmupSet(
                  workout,
                  position,
                  setNumber,
                  {
                    weightKg: prev.weightKg,
                    reps: prev.reps,
                    durationSeconds: prev.durationSeconds,
                    distanceMeters: prev.distanceMeters,
                  },
                  now(),
                ),
              );
            }}
            onRemove={(setNumber) => {
              save.mutate(removeWarmupSet(workout, position, setNumber, now()));
            }}
          />
          <ol className="flex flex-col gap-3">
            {setNumbers(exercise).map((number) => {
              const sets = exercise.sets.filter((set) => !set.isWarmup && set.setNumber === number);
              const sides = sidesOf(exercise.isUnilateral);
              const before: BySide<PreviousSetValues> = {};
              const source: BySide<PreviousSetValues> = {};
              for (const side of sides) {
                before[side] = previousSet(previous, number, side);
                source[side] = copySource(rest.sameButton, exercise, number, before[side], side);
              }
              return (
                <SetEditor
                  key={number}
                  exercise={exercise}
                  sets={sets}
                  previous={before}
                  copySource={source}
                  onCopy={() => {
                    apply(
                      copySides(workout, position, number, source, now()),
                      number,
                      ADVANCE_AFTER_COPY_MS,
                    );
                  }}
                  onUnmark={() => {
                    setAdvance(null);
                    save.mutate(unmarkSet(workout, position, number, now()));
                  }}
                  onChange={(side: Side, patch) => {
                    apply(
                      changeSet(workout, position, number, patch, now(), side),
                      number,
                      ADVANCE_DELAY_MS,
                    );
                  }}
                />
              );
            })}
          </ol>
          {setNumbers(exercise).length >= MAX_SETS ? null : (
            <button
              type="button"
              className="focus-ring border-border-strong text-muted hover:text-foreground hover:bg-foreground/5 min-h-14 w-full rounded-3xl border border-dashed text-sm font-semibold transition-colors"
              onClick={() => {
                save.mutate(addSet(workout, position, now(), () => crypto.randomUUID()));
              }}
            >
              {t('workouts.set.add')}
            </button>
          )}
          <ExerciseActions
            canSkip={canSkip(exercise)}
            onReplace={() => {
              setPicking(true);
            }}
            onSkip={() => {
              save.mutate(skipExercise(workout, position, now()));
            }}
          />
        </>
      )}
      <div
        className="flex flex-col gap-2 rounded-2xl border border-border bg-background/50 p-3.5"
        data-testid="day-note-section"
      >
        <div className="flex items-center justify-between">
          <label htmlFor={`day-note-${exercise.id}`} className="eyebrow text-xs font-semibold">
            {t('workouts.exercise.dayNote')}
          </label>
          <span className="text-muted text-xs">
            {t('workouts.exercise.dayNoteLimit', { count: noteDraft.length })}
          </span>
        </div>
        <textarea
          id={`day-note-${exercise.id}`}
          rows={2}
          maxLength={500}
          aria-label={t('workouts.exercise.dayNote')}
          placeholder={t('workouts.exercise.dayNotePlaceholder')}
          className="focus-ring border-border bg-background/80 text-foreground w-full resize-none rounded-xl border p-2.5 text-sm outline-none"
          value={noteDraft}
          onFocus={() => {
            void (async () => {
              if (!isGranted) {
                const ok = await ensure();
                if (!ok) {
                  (document.activeElement as HTMLElement)?.blur();
                }
              }
            })();
          }}
          onChange={(e) => {
            setNoteDraft(e.target.value);
          }}
          onBlur={() => {
            void (async () => {
              if (!isGranted) {
                const ok = await ensure();
                if (!ok) {
                  setNoteDraft(exercise.dayNote ?? '');
                  return;
                }
              }
              if (noteDraft.trim() !== (exercise.dayNote ?? '').trim()) {
                save.mutate(setDayNote(workout, position, noteDraft, now()));
              }
            })();
          }}
        />
        {!isGranted && (
          <p className="text-muted text-xs">{t('workouts.exercise.dayNoteNoConsent')}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={buttonClassName('secondary', undefined, 'lg')}
          disabled={position === 1}
          onClick={() => {
            go(position - 1);
          }}
        >
          <Icon name="chevronLeft" className="size-5" />
          {t('workouts.workout.previous')}
        </button>
        <button
          type="button"
          className={buttonClassName('secondary', undefined, 'lg')}
          disabled={position === count}
          onClick={() => {
            go(position + 1);
          }}
        >
          {t('workouts.workout.next')}
          <Icon name="chevronRight" className="size-5" />
        </button>
      </div>
    </div>
  );
}
