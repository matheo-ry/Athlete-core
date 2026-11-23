import { useTranslation } from 'react-i18next';

import { BackLink, Card, EmptyState, buttonClassName } from '@/core/ui';
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
    <BackLink to={`?day=${String(props.dayNumber)}`}>{t('programs.client.backToDay')}</BackLink>
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
      <h2 className="display animate-enter text-[2.4rem] break-words">{exercise?.name ?? '…'}</h2>
      <Card className="flex flex-col gap-3">
        <h3 className="eyebrow text-muted">{t('programs.client.sets')}</h3>
        <ol aria-label={t('programs.client.sets')} className="flex flex-col gap-1.5">
          {item.sets.map((set, index) => (
            <li
              key={set.id ?? index}
              className="bg-glass rounded-2xl px-4 py-3 font-medium tabular-nums shadow-[inset_0_0_0_1px_var(--color-hairline)]"
            >
              {t('programs.client.setLine', {
                number: index + 1,
                // El resumen de una sola serie, sin el "1 ×" ni el descanso.
                text: summaryOf({ ...item, sets: [set], restSeconds: null }).replace(/^1 × /, ''),
              })}
            </li>
          ))}
        </ol>
        {item.restSeconds === null ? null : (
          <p className="text-muted text-sm">
            {t('programs.client.rest', { time: formatRest(item.restSeconds) })}
          </p>
        )}
      </Card>
      {item.note === null ? null : (
        <Card className="flex flex-col gap-2">
          <h3 className="eyebrow text-primary-readable">{t('programs.client.coachNote')}</h3>
          <p className="whitespace-pre-line">{item.note}</p>
        </Card>
      )}
      {exercise?.instructions === null || exercise?.instructions === undefined ? null : (
        <Card className="flex flex-col gap-2">
          <h3 className="eyebrow text-muted">{t('programs.client.instructions')}</h3>
          <p className="whitespace-pre-line">{exercise.instructions}</p>
        </Card>
      )}
      {exercise?.videoUrl === null || exercise?.videoUrl === undefined ? null : (
        <a
          href={exercise.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName('secondary', 'w-full', 'lg')}
        >
          {t('programs.client.watchVideo')}
        </a>
      )}
    </div>
  );
}
