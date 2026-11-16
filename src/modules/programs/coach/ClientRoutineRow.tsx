import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';

import { routineProgress } from '../model/assignments';
import type { ClientRoutines } from '../model/assignments';
import { shortDate, useProgressText } from '../shared/useProgressText';

interface ClientRoutineRowProps {
  name: string;
  routines: ClientRoutines | undefined;
  today: string;
}

/**
 * Un cliente en "Asignadas" (PR 2.13b, D-085): su rutina vigente con el
 * bloque y la vuelta en que va y cuándo termina; su próxima, si la tiene; o
 * "Sin rutina".
 */
export function ClientRoutineRow({ name, routines, today }: ClientRoutineRowProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const current = routines?.current ?? null;
  const next = routines?.next ?? null;
  const progress = current === null ? null : routineProgress(current, today);
  const progressText = useProgressText();

  return (
    <li className="border-border flex flex-col gap-0.5 border-b py-3 last:border-b-0">
      <span className="font-medium break-words">{name}</span>
      {current === null ? (
        <span className="text-muted text-sm">{t('programs.assigned.noProgram')}</span>
      ) : (
        <span className="text-sm">
          <span className="font-medium">{current.name}</span>
          {progress === null ? null : ` · ${progressText(progress)}`}
          {current.mode === 'list' ? ` · ${t('programs.assigned.listMode')}` : null}
        </span>
      )}
      {next === null ? null : (
        <span className="text-muted text-sm">
          {t('programs.assigned.next', {
            name: next.name,
            date: shortDate(next.startsOn, language),
          })}
        </span>
      )}
    </li>
  );
}
