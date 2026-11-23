import { NotebookPen } from 'lucide-react';
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-muted">
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
        <ul className="flex flex-col gap-1.5 text-sm" data-testid={`history-${exerciseId}`}>
          {history.map((sess) => (
            <li
              key={`${sess.workoutId}-${sess.sessionNumber}`}
              className="bg-glass flex flex-col gap-1 rounded-2xl px-4 py-3 tabular-nums shadow-[inset_0_0_0_1px_var(--color-hairline)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-foreground">{sess.label}: </span>
                  <span className="text-foreground">{sess.setsText}</span>
                </div>
                <div className="text-muted flex items-center gap-2 text-xs">
                  {sess.hasNote ? (
                    <span
                      className="inline-flex items-center gap-1 font-medium text-primary-readable"
                      data-testid="note-mark"
                    >
                      <NotebookPen aria-hidden="true" className="size-3.5" />{' '}
                      {t('progress.history.note')}
                    </span>
                  ) : null}
                  <span>{formatDate(sess.performedOn, language)}</span>
                </div>
              </div>

              {sess.hasNote && sess.dayNote ? (
                <div
                  className="border-primary text-muted mt-1 border-l-2 py-0.5 pl-3 text-xs italic"
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
