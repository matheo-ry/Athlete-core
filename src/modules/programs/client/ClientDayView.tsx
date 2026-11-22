import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { canLogWorkouts } from '@/core/native';
import { Card, EmptyState, Icon, buttonClassName } from '@/core/ui';
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

  const back = (
    <Link to="?" className={buttonClassName('ghost', '-ml-3 self-start')}>
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

  return (
    <div className="flex flex-col gap-5">
      {back}
      <header className="flex flex-col gap-1.5">
        <h2 className="text-3xl leading-[1.08] font-semibold">
          {[label(day.dayNumber), day.name].filter((part) => part !== null).join(' · ')}
        </h2>
        {day.subtitle === null && day.place === null ? null : (
          <p className="text-muted text-lg">
            {[day.subtitle, day.place].filter((part) => part !== null).join(' · ')}
          </p>
        )}
      </header>
      {day.kind === 'rest' ? (
        <Card className="flex items-center gap-4">
          <span className="surface-raised text-muted flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <Icon name="moon" />
          </span>
          <p>{t('programs.client.restDay')}</p>
        </Card>
      ) : (
        <>
          {/* Un enlace a la ruta de `workouts`, sin importar el módulo (D-119). */}
          {canLogWorkouts() ? (
            <Link
              to={`/client/workout?day=${String(day.dayNumber)}`}
              className={buttonClassName('primary', 'w-full', 'lg')}
            >
              <Icon name="play" />
              {t('programs.client.startWorkout')}
            </Link>
          ) : (
            <p className="text-muted flex items-center gap-2 text-sm">
              <Icon name="smartphone" className="size-4 shrink-0" />
              {t('programs.client.openMobileApp')}
            </p>
          )}
          <ol aria-label={t('programs.editor.exercisesLabel')} className="flex flex-col gap-2">
            {day.exercises.map((item, index) => (
              <li key={item.id ?? index}>
                <Link
                  to={`?day=${String(day.dayNumber)}&exercise=${String(index + 1)}`}
                  className="surface focus-ring group flex items-start gap-3 rounded-2xl p-3 pr-2 transition-transform active:scale-[0.99]"
                >
                  <span
                    aria-hidden="true"
                    className="numeric bg-foreground/8 text-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs"
                  >
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-semibold">
                      <span className="sr-only">{index + 1}. </span>
                      {options.byId.get(item.exerciseId)?.name ?? '…'}
                    </span>
                    <GroupTag group={groupInfo(day, index)} />
                    <span className="numeric text-muted text-sm">{summaryOf(item)}</span>
                    {item.note === null ? null : (
                      <span className="border-accent text-muted border-l-2 pl-2 text-sm">
                        {item.note}
                      </span>
                    )}
                  </span>
                  <Icon
                    name="chevronRight"
                    className="text-muted mt-1.5 size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
