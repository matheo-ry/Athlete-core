import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card, EmptyState, Icon, buttonClassName } from '@/core/ui';
import { useExerciseOptions } from '@/modules/exercises';

import type { ClientProgram } from '../model/assignments';
import { clientBlock } from '../model/client-view';
import { formatRest } from '../model/prescription';
import type { ProgramDocument } from '../model/program-document';
import { useExerciseSummary } from '../shared/useExerciseSummary';

interface ClientExerciseViewProps {
  program: ClientProgram;
  document: ProgramDocument;
  today: string;
  dayNumber: number;
  /** Desde 1. */
  position: number;
}

/**
 * Un ejercicio, para el cliente (D-084): sus series una a una, el descanso,
 * la nota del coach, las instrucciones y "Ver vídeo", que abre el enlace
 * fuera de la app (D-074). Todo en lectura: apuntar llega en la Fase 3.
 */
export function ClientExerciseView(props: ClientExerciseViewProps) {
  const { t } = useTranslation();
  const summaryOf = useExerciseSummary();
  const options = useExerciseOptions();
  const block = clientBlock(props.program, props.document, props.today)?.block;
  const day = block?.days.find((item) => item.dayNumber === props.dayNumber);
  const item = day?.exercises[props.position - 1];
  const exercise = item === undefined ? undefined : options.byId.get(item.exerciseId);

  const back = (
    <Link
      to={`?day=${String(props.dayNumber)}`}
      className={buttonClassName('ghost', '-ml-3 self-start')}
    >
      {t('programs.client.backToDay')}
    </Link>
  );
  if (item === undefined) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <EmptyState title={t('programs.client.exerciseNotFound')} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {back}
      <h2 className="text-3xl leading-[1.08] font-semibold">{exercise?.name ?? '…'}</h2>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="eyebrow">{t('programs.client.sets')}</h3>
          {item.restSeconds === null ? null : (
            <p className="text-muted flex items-center gap-1.5 text-sm">
              <Icon name="timer" className="size-4" />
              {t('programs.client.rest', { time: formatRest(item.restSeconds) })}
            </p>
          )}
        </div>
        <ol aria-label={t('programs.client.sets')} className="flex flex-col gap-1.5">
          {item.sets.map((set, index) => (
            <li
              key={set.id ?? index}
              className="numeric bg-background/60 border-border rounded-xl border px-3 py-2.5 text-sm"
            >
              {t('programs.client.setLine', {
                number: index + 1,
                // El resumen de una sola serie, sin el "1 ×" ni el descanso.
                text: summaryOf({ ...item, sets: [set], restSeconds: null }).replace(/^1 × /, ''),
              })}
            </li>
          ))}
        </ol>
      </Card>
      {item.note === null ? null : (
        <Card tone="raised" className="border-l-accent flex flex-col gap-2 border-l-2">
          <h3 className="eyebrow">{t('programs.client.coachNote')}</h3>
          <p className="leading-7 whitespace-pre-line">{item.note}</p>
        </Card>
      )}
      {exercise?.instructions === null || exercise?.instructions === undefined ? null : (
        <Card className="flex flex-col gap-2">
          <h3 className="eyebrow">{t('programs.client.instructions')}</h3>
          <p className="leading-7 whitespace-pre-line">{exercise.instructions}</p>
        </Card>
      )}
      {exercise?.videoUrl === null || exercise?.videoUrl === undefined ? null : (
        <a
          href={exercise.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName('secondary', 'w-full', 'lg')}
        >
          <Icon name="play" />
          {t('programs.client.watchVideo')}
        </a>
      )}
    </div>
  );
}
