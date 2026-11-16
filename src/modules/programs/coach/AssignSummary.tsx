import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';

import type { AssignmentWarning } from '../model/assignments';
import { daysBetween, programEndsOn } from '../model/calendar';
import type { CalendarBlock } from '../model/calendar';

interface AssignSummaryProps {
  blocks: CalendarBlock[];
  startsOn: string;
  today: string;
  warnings: (AssignmentWarning & { clientName: string })[];
}

/** Una fecha "AAAA-MM-DD" como "13 de diciembre", sin mover el día por la zona horaria. */
function longDate(date: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * Antes de confirmar (PR 2.13): cuándo empieza y termina, y a quién se le
 * sustituye la rutina que tenía (D-081).
 */
export function AssignSummary({ blocks, startsOn, today, warnings }: AssignSummaryProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const endsOn = programEndsOn(blocks, startsOn);
  const isFuture = daysBetween(today, startsOn) > 0;

  return (
    <div className="border-border flex flex-col gap-1 rounded-lg border p-3 text-sm">
      {isFuture ? (
        <p>{t('programs.assign.startsLater', { date: longDate(startsOn, language) })}</p>
      ) : null}
      <p className="font-medium">
        {endsOn === null
          ? t('programs.assign.repeats')
          : t('programs.assign.endsOn', { date: longDate(endsOn, language) })}
      </p>
      {warnings.map((warning) => (
        <p key={warning.clientId} role="note">
          {t(`programs.assign.${warning.kind}`, {
            client: warning.clientName,
            program: warning.programName,
          })}
        </p>
      ))}
    </div>
  );
}
