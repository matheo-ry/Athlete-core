import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { canLogWorkouts } from '@/core/native';
import { Card, EmptyState, buttonClassName } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import type { ClientProgram } from '../model/assignments';
import { clientBlock, dayExecutionStatus } from '../model/client-view';
import type { ProgramDocument } from '../model/program-document';
import { groupInfo } from '../model/supersets';
import { useDayLabel } from '../shared/useDayText';
import { GroupTag } from '../shared/GroupTag';
import { useExerciseSummary } from '../shared/useExerciseSummary';

interface ClientDayViewProps {
  program: ClientProgram;
  document: ProgramDocument;
  today: string;
  dayNumber: number;
}

/**
 * Un día de la rutina, para el cliente (D-084): sus ejercicios en orden, cada
 * uno con su resumen ("3 × 8-12 · RIR 1 · 2:00") y la nota del coach.
 */
export function ClientDayView({ program, document, today, dayNumber }: ClientDayViewProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const current = clientBlock(program, document, today);
  const block = current?.block ?? document.blocks[0];
  const label = useDayLabel(block);
  const summaryOf = useExerciseSummary();
  const options = useExerciseOptions();
  const day = block?.days.find((item) => item.dayNumber === dayNumber);

  const back = (
    <Link to="?" className={buttonClassName('ghost', 'self-start')}>
      {t('programs.client.backToProgram')}
    </Link>
  );
  if (day === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <EmptyState title={t('programs.client.dayNotFound')} />
      </div>
    );
  }

  const status =
    program.mode === 'calendar'
      ? dayExecutionStatus(day, {
          program,
          blockId: block?.id ?? null,
          blockIndex: current?.blockIndex ?? 0,
          lap: current?.lap ?? 1,
          today,
          language,
        })
      : { kind: 'normal' as const };
  const baseLabel =
    status.kind === 'done_other_day'
      ? t('programs.client.doneOnWeekday', { name: label(day.dayNumber), weekday: status.weekday })
      : label(day.dayNumber);

  return (
    <div className="flex flex-col gap-4">
      {back}
      <header>
        <h2 className="text-xl font-semibold">
          {[baseLabel, day.name].filter((part) => part !== null).join(' · ')}
          {status.kind === 'missed' ? ` · ${t('programs.client.missed')}` : null}
        </h2>
        {day.subtitle === null && day.place === null ? null : (
          <p className="text-muted">
            {[day.subtitle, day.place].filter((part) => part !== null).join(' · ')}
          </p>
        )}
      </header>
      {day.kind === 'rest' ? (
        <Card>
          <p>{t('programs.client.restDay')}</p>
        </Card>
      ) : (
        <>
          {/* Un enlace a la ruta de `workouts`, sin importar el módulo (D-119). */}
          {canLogWorkouts() ? (
            <Link
              to={`/client/workout?day=${String(day.dayNumber)}`}
              className={buttonClassName('primary', 'self-start')}
            >
              {t('programs.client.startWorkout')}
            </Link>
          ) : (
            <p className="text-muted text-sm">{t('programs.client.openMobileApp')}</p>
          )}
          <Card>
            <ol aria-label={t('programs.editor.exercisesLabel')}>
              {day.exercises.map((item, index) => (
                <li key={item.id ?? index} className="border-border border-b last:border-b-0">
                  <Link
                    to={`?day=${String(day.dayNumber)}&exercise=${String(index + 1)}`}
                    className="hover:bg-background focus-visible:outline-primary-readable flex min-h-14 flex-col justify-center rounded-lg px-2 py-2 focus-visible:outline-2"
                  >
                    <span className="font-medium">
                      {index + 1}. {options.byId.get(item.exerciseId)?.name ?? '…'}
                    </span>
                    <GroupTag group={groupInfo(day, index)} />
                    <span className="text-muted text-sm">{summaryOf(item)}</span>
                    {item.note === null ? null : <span className="text-sm">{item.note}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
