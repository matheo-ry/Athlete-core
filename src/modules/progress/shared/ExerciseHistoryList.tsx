import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import { buttonClassName } from '@/core/ui';

import type { ExerciseSessionHistory } from '../model/exercise-history';

interface ExerciseHistoryListProps {
  exerciseId: string;
  history: readonly ExerciseSessionHistory[];
}

/** Historial en texto de un ejercicio ("DIA 1: 45×8(1)…"), desplegable. */
export function ExerciseHistoryList({ exerciseId, history }: ExerciseHistoryListProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-muted uppercase">
          {t('progress.history.title')} ({history.length})
        </span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={buttonClassName('ghost', 'px-2 text-xs')}
        >
          {open ? t('progress.history.hideHistory') : t('progress.history.showHistory')}
        </button>
      </div>

      {open ? (
        <ul className="flex flex-col gap-2 font-mono text-sm" data-testid={`history-${exerciseId}`}>
          {history.map((sess) => (
            <li
              key={`${sess.workoutId}-${sess.sessionNumber}`}
              className="flex flex-col gap-1 rounded border border-border bg-background p-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground">{sess.label}: </span>
                  <span className="text-foreground">{sess.setsText}</span>
                </div>
                <div className="flex items-center gap-2 font-sans text-xs text-muted">
                  {sess.hasNote ? (
                    <span
                      className="inline-flex items-center gap-1 font-medium text-primary-readable"
                      data-testid="note-mark"
                    >
                      <span aria-hidden="true">📝</span> {t('progress.history.note')}
                    </span>
                  ) : null}
                  <span>{formatDate(sess.performedOn, language)}</span>
                </div>
              </div>

              {sess.hasNote && sess.dayNote ? (
                <div
                  className="mt-1 rounded border-l-2 border-primary bg-surface px-2 py-1 font-sans text-xs text-muted italic"
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
  );
}
