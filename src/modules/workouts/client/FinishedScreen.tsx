import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { cn } from '@/core/lib';
import { useHealthConsent, useHealthConsentPrompt, useTenantSettings } from '@/core/tenancy';
import { Button, Card, Icon, StateOrbit, buttonClassName } from '@/core/ui';

import { useSaveActiveWorkout } from '../api/useActiveWorkout';
import { useWorkoutMiniAchievements } from '../api/useWorkoutMiniAchievements';
import { setWorkoutNote } from '../model/active-workout';
import type { ActiveWorkout } from '../model/active-workout';
import { finishedSummary } from '../model/close-workout';
import { formatDuration } from '../model/workout-format';

/**
 * El resumen final de un entreno recién cerrado (D-119): duración, series
 * hechas y ejercicios, en tres o cuatro cifras grandes. Es el momento de celebrarlo.
 * Incluye la nota final del entreno (D-ideas-10), opcional y sujeta a D-126.
 */
export function FinishedScreen({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const { achievementsEnabled } = useTenantSettings();
  const miniAchievementsCount = useWorkoutMiniAchievements(workout);
  const summary = finishedSummary(workout);
  const isCompleted = workout.closeReason === 'completed';
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

  if (achievementsEnabled && miniAchievementsCount > 0) {
    rows.push({
      label: t('workouts.finished.miniAchievements'),
      value: String(miniAchievementsCount),
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-4 text-center">
      <StateOrbit>
        <Icon name={isCompleted ? 'trophy' : 'check'} className="text-primary-readable size-7" />
      </StateOrbit>
      <h1 className="text-3xl leading-[1.08] font-semibold">
        {isCompleted ? t('workouts.finished.titleCompleted') : t('workouts.finished.title')}
      </h1>
      <dl
        className={cn(
          'grid w-full gap-2',
          rows.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3',
        )}
      >
        {rows.map((row, index) => (
          <div
            key={row.label}
            className="surface animate-rise flex flex-col gap-2 rounded-2xl px-2 py-4"
            style={{ '--rise-delay': `${String(150 + index * 90)}ms` } as CSSProperties}
          >
            <dt className="eyebrow">{row.label}</dt>
            <dd className="numeric text-xl font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      <FinalWorkoutNote workout={workout} />
      <Link to="/client" replace className={buttonClassName('primary', 'w-full', 'lg')}>
        {t('workouts.finished.done')}
      </Link>
    </div>
  );
}

/** Nota final del entreno entero (D-ideas-10): sale sola al terminar, opcional y con D-126. */
function FinalWorkoutNote({ workout }: { workout: ActiveWorkout }) {
  const { t } = useTranslation();
  const save = useSaveActiveWorkout();
  const { ensure } = useHealthConsentPrompt();
  const { isGranted } = useHealthConsent();
  const [draft, setDraft] = useState(workout.note ?? '');
  const [skipped, setSkipped] = useState(false);
  const [editing, setEditing] = useState(workout.note === null);

  if (skipped && workout.note === null) {
    return null;
  }

  if (!editing && workout.note !== null) {
    return (
      <Card data-testid="finished-workout-note" className="flex w-full flex-col gap-2 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow text-xs font-semibold">{t('workouts.finished.noteTitle')}</span>
          <button
            type="button"
            className="text-primary-readable text-xs font-medium underline"
            onClick={() => {
              setDraft(workout.note ?? '');
              setEditing(true);
            }}
          >
            {t('workouts.finished.noteEdit')}
          </button>
        </div>
        <p className="text-sm whitespace-pre-wrap">{workout.note}</p>
      </Card>
    );
  }

  return (
    <Card data-testid="finished-workout-note" className="flex w-full flex-col gap-3 text-left">
      <div className="flex items-center justify-between">
        <label htmlFor={`final-note-${workout.id}`} className="eyebrow text-xs font-semibold">
          {t('workouts.finished.noteTitle')}
        </label>
        <span className="text-muted text-xs">
          {t('workouts.exercise.dayNoteLimit', { count: draft.length })}
        </span>
      </div>
      <textarea
        id={`final-note-${workout.id}`}
        rows={3}
        maxLength={500}
        aria-label={t('workouts.finished.noteTitle')}
        placeholder={t('workouts.finished.notePlaceholder')}
        className="focus-ring border-border bg-background/80 text-foreground w-full resize-none rounded-xl border p-2.5 text-sm outline-none"
        value={draft}
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
          setDraft(e.target.value);
        }}
      />
      {!isGranted ? (
        <p className="text-muted text-xs">{t('workouts.finished.noteNoConsent')}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={save.isPending}
          onClick={() => {
            setSkipped(true);
            setEditing(false);
          }}
        >
          {t('workouts.finished.noteSkip')}
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={save.isPending || draft.trim() === (workout.note ?? '')}
          onClick={() => {
            void (async () => {
              if (!isGranted) {
                const ok = await ensure();
                if (!ok) {
                  return;
                }
              }
              const updated = setWorkoutNote(workout, draft, new Date().toISOString());
              await save.mutateAsync(updated);
              setEditing(false);
            })();
          }}
        >
          {t('workouts.finished.noteSave')}
        </Button>
      </div>
    </Card>
  );
}
