import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import { Icon } from '@/core/ui';

import type { ExerciseSessionHistory } from '../model/exercise-history';

interface ExerciseHistoryListProps {
  exerciseId: string;
  history: readonly ExerciseSessionHistory[];
}

/** Cuántas sesiones se ven sin pulsar "Ver todo": las más recientes. */
const RECENT = 5;

/**
 * Historial en texto de un ejercicio ("DIA 1: 45×8(1)…"), desplegable. Enseña
 * las últimas sesiones y, si hay más, "Ver todo": así la tarjeta no se alarga.
 */
export function ExerciseHistoryList({ exerciseId, history }: ExerciseHistoryListProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? history : history.slice(-RECENT);

  return (
    <div className="border-border flex flex-col gap-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">
          {t('progress.history.title')} ({history.length})
        </span>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="focus-ring text-muted hover:text-foreground min-h-11 rounded-full px-3 text-xs font-semibold transition-colors"
        >
          {open ? t('progress.history.hideHistory') : t('progress.history.showHistory')}
        </button>
      </div>

      {open ? (
        <ul className="flex flex-col gap-1.5" data-testid={`history-${exerciseId}`}>
          {visible.map((sess) => (
            <li
              key={`${sess.workoutId}-${sess.sessionNumber}`}
              className="bg-background/60 border-border flex flex-col gap-1.5 rounded-xl border px-3 py-2.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="numeric flex items-baseline gap-2 text-sm">
                  <span className="text-muted font-medium">{sess.label}: </span>
                  <span className="text-foreground">{sess.setsText}</span>
                </div>
                <div className="text-muted flex items-center gap-2 text-xs">
                  {sess.hasNote ? (
                    <span
                      className="text-primary-readable inline-flex items-center gap-1 font-medium"
                      data-testid="note-mark"
                    >
                      <Icon name="note" className="size-3.5" />
                      {t('progress.history.note')}
                    </span>
                  ) : null}
                  <span>{formatDate(sess.performedOn, language)}</span>
                </div>
              </div>

              {sess.hasNote && sess.dayNote ? (
                <p
                  className="border-accent text-muted border-l-2 pl-2.5 text-sm leading-6"
                  data-testid="session-note"
                >
                  “{sess.dayNote}”
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {open && !showAll && history.length > RECENT ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="focus-ring text-primary-readable min-h-11 self-start rounded-full px-3 text-sm font-semibold"
        >
          {t('progress.history.showAll', { count: history.length })}
        </button>
      ) : null}
    </div>
  );
}
