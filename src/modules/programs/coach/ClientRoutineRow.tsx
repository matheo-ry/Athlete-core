import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';

import { routineProgress } from '../model/assignments';
import type { ClientRoutines, RoutineProgress } from '../model/assignments';

interface ClientRoutineRowProps {
  name: string;
  routines: ClientRoutines | undefined;
  today: string;
}

/** Una fecha "AAAA-MM-DD" corta, sin mover el día por la zona horaria. */
function shortDate(date: string, language: string): string {
  return formatDate(`${date}T00:00:00Z`, language, 'UTC');
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

  const where = (value: RoutineProgress): string[] => {
    const parts: string[] = [];
    if (value.blockCount > 1) {
      parts.push(
        t('programs.assigned.block', { number: value.blockNumber, count: value.blockCount }),
      );
    }
    if (value.isRepeating) {
      parts.push(t('programs.assigned.repeating'));
      return parts;
    }
    const unit = value.isWeekly ? 'week' : 'lap';
    if (value.lap === 0) {
      parts.push(t('programs.assigned.firstWeek'));
    } else {
      parts.push(
        value.laps === null
          ? t(`programs.assigned.${unit}NoEnd`, { lap: value.lap })
          : t(`programs.assigned.${unit}`, { lap: value.lap, laps: value.laps }),
      );
    }
    parts.push(
      value.endsOn === null
        ? t('programs.assigned.noEnd')
        : t('programs.assigned.endsOn', { date: shortDate(value.endsOn, language) }),
    );
    return parts;
  };

  return (
    <li className="border-border flex flex-col gap-0.5 border-b py-3 last:border-b-0">
      <span className="font-medium break-words">{name}</span>
      {current === null ? (
        <span className="text-muted text-sm">{t('programs.assigned.noProgram')}</span>
      ) : (
        <span className="text-sm">
          <span className="font-medium">{current.name}</span>
          {progress === null ? null : ` · ${where(progress).join(' · ')}`}
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
