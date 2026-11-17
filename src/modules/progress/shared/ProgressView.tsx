import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate, formatWeight } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';
import { Card, EmptyState, ErrorState, Spinner, buttonClassName } from '@/core/ui';

import type { ExerciseProgressItem, ProgramProgressGroup } from '../model/exercise-history';

interface ProgressViewProps {
  groups: ProgramProgressGroup[];
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
  unit: WeightUnit;
}

export function ProgressView({ groups, isPending, isError, onRetry, unit }: ProgressViewProps) {
  const { t } = useTranslation();

  if (isPending) {
    return <Spinner />;
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  const hasAnyExercise = groups.some((g) => g.exercises.length > 0);
  if (!hasAnyExercise) {
    return (
      <EmptyState title={t('progress.empty.title')} description={t('progress.empty.description')} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        if (group.exercises.length === 0) {
          return null;
        }

        return (
          <section key={group.programId} className="flex flex-col gap-3">
            <header className="flex items-center justify-between gap-2 border-b pb-2 border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{group.programName}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    group.isCurrent
                      ? 'bg-primary/10 text-primary-readable'
                      : 'border border-border text-muted'
                  }`}
                >
                  {group.isCurrent ? t('progress.routine.current') : t('progress.routine.past')}
                </span>
              </div>
            </header>

            <div className="flex flex-col gap-3">
              {group.exercises.map((exercise) => (
                <ExerciseCard key={exercise.exerciseId} exercise={exercise} unit={unit} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface ExerciseCardProps {
  exercise: ExerciseProgressItem;
  unit: WeightUnit;
}

function ExerciseCard({ exercise, unit }: ExerciseCardProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const [showHistory, setShowHistory] = useState(true);

  const { records, lastSession, history } = exercise;

  const recordParts: string[] = [];
  if (records.maxWeightKg != null && records.maxWeightKg > 0) {
    recordParts.push(
      `${t('progress.stats.maxWeight')}: ${formatWeight(records.maxWeightKg, unit, language)}`,
    );
  }
  if (records.maxRm != null && records.maxRm > 0) {
    recordParts.push(
      `${t('progress.stats.estimatedRm')}: ${formatWeight(records.maxRm, unit, language)}`,
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">{exercise.displayName}</h3>
          {exercise.isUnilateral ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
              Unilateral
            </span>
          ) : null}
        </div>

        {recordParts.length > 0 ? (
          <div className="flex items-center gap-1.5" data-testid={`record-${exercise.exerciseId}`}>
            <span className="inline-flex items-center rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-semibold">
              <span className="text-primary font-bold mr-1">★ {t('progress.stats.record')}:</span>
              {recordParts.join(' · ')}
            </span>
          </div>
        ) : null}
      </header>

      {lastSession ? (
        <div className="text-muted text-xs flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{t('progress.stats.last')}:</span>
          <span>{formatDate(lastSession.performedOn, language)}</span>
          <span>·</span>
          <span className="font-mono text-foreground">{lastSession.setsText}</span>
        </div>
      ) : null}

      <div className="border-t border-border pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {t('progress.history.title')} ({history.length})
          </span>
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className={buttonClassName('ghost', 'text-xs py-1 px-2 h-auto')}
          >
            {showHistory ? t('progress.history.hideHistory') : t('progress.history.showHistory')}
          </button>
        </div>

        {showHistory ? (
          <ul
            className="flex flex-col gap-2 font-mono text-sm"
            data-testid={`history-${exercise.exerciseId}`}
          >
            {history.map((sess) => (
              <li
                key={`${sess.workoutId}-${sess.sessionNumber}`}
                className="flex flex-col gap-1 rounded bg-surface/50 p-2 border border-border/50"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-foreground">{sess.label}: </span>
                    <span className="text-foreground">{sess.setsText}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-sans text-muted">
                    {sess.hasNote ? (
                      <span
                        className="inline-flex items-center gap-1 text-primary font-medium"
                        title={sess.dayNote ?? ''}
                        data-testid="note-mark"
                      >
                        📝 {t('progress.history.note')}
                      </span>
                    ) : null}
                    <span>{formatDate(sess.performedOn, language)}</span>
                  </div>
                </div>

                {sess.hasNote && sess.dayNote ? (
                  <div
                    className="font-sans text-xs italic text-muted mt-1 bg-surface-raised/80 rounded px-2 py-1 border-l-2 border-primary"
                    data-testid="session-note"
                  >
                    "{sess.dayNote}"
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
