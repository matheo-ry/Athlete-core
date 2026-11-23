import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { canLogWorkouts } from '@/core/native';
import { BackLink, Card, EmptyState, ROW_LINK_CLASS, buttonClassName } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import type { ClientProgram } from '../model/assignments';
import { clientBlock } from '../model/client-view';
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
  const current = clientBlock(program, document, today);
  const block = current?.block ?? document.blocks[0];
  const label = useDayLabel(block);
  const summaryOf = useExerciseSummary();
  const options = useExerciseOptions();
  const day = block?.days.find((item) => item.dayNumber === dayNumber);

  const back = <BackLink to="?">{t('programs.client.backToProgram')}</BackLink>;
  if (day === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <EmptyState title={t('programs.client.dayNotFound')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {back}
      <header className="animate-enter flex flex-col gap-2">
        {day.subtitle === null && day.place === null ? null : (
          <p className="eyebrow text-muted">
            {[day.subtitle, day.place].filter((part) => part !== null).join(' · ')}
          </p>
        )}
        <h2 className="display text-[2.4rem] break-words">
          {[label(day.dayNumber), day.name].filter((part) => part !== null).join(' · ')}
        </h2>
      </header>
      {day.kind === 'rest' ? (
        <Card>
          <p className="display text-2xl">{t('programs.client.restDay')}</p>
        </Card>
      ) : (
        <>
          {/* Un enlace a la ruta de `workouts`, sin importar el módulo (D-119). */}
          {canLogWorkouts() ? (
            <Link
              to={`/client/workout?day=${String(day.dayNumber)}`}
              className={buttonClassName('primary', 'w-full', 'lg')}
            >
              {t('programs.client.startWorkout')}
            </Link>
          ) : (
            <p className="glass text-muted rounded-2xl px-4 py-3 text-sm">
              {t('programs.client.openMobileApp')}
            </p>
          )}
          <Card className="p-2">
            <ol aria-label={t('programs.editor.exercisesLabel')} className="flex flex-col">
              {day.exercises.map((item, index) => (
                <li key={item.id ?? index}>
                  <Link
                    to={`?day=${String(day.dayNumber)}&exercise=${String(index + 1)}`}
                    className={`${ROW_LINK_CLASS} items-start!`}
                  >
                    <span
                      aria-hidden="true"
                      className="numeral bg-glass-strong text-muted mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-sm"
                    >
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      {/* El número también va en el texto: lo lee el lector de pantalla. */}
                      <span className="font-semibold">
                        <span className="sr-only">{index + 1}. </span>
                        {options.byId.get(item.exerciseId)?.name ?? '…'}
                      </span>
                      <GroupTag group={groupInfo(day, index)} />
                      <span className="text-muted text-sm">{summaryOf(item)}</span>
                      {item.note === null ? null : (
                        <span className="text-foreground/80 text-sm">{item.note}</span>
                      )}
                    </span>
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
