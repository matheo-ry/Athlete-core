import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { cn } from '@/core/lib';

import type { ClientProgram } from '../model/assignments';
import { localToday } from '../model/calendar';
import { dayExecutionStatus } from '../model/client-view';
import type { ProgramBlock } from '../model/program-document';
import { useDayLabel, useDaySummary } from '../shared/useDayText';

interface BlockDaysProps {
  block: ProgramBlock;
  /** El día que toca hoy, marcado; vacío en modo lista o si aún no ha empezado. */
  todayNumber: number | null;
  program?: ClientProgram;
  blockIndex?: number;
  lap?: number;
  today?: string;
}

/** Los días de un bloque, en lectura, con su resumen (PR 2.14). */
export function BlockDays({
  block,
  todayNumber,
  program,
  blockIndex = 0,
  lap = 1,
  today,
}: BlockDaysProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const label = useDayLabel(block);
  const summary = useDaySummary();

  return (
    <ul aria-label={t('programs.clientTab.daysLabel')}>
      {block.days.map((day) => {
        const status =
          program && program.mode === 'calendar'
            ? dayExecutionStatus(day, {
                program,
                blockId: block.id,
                blockIndex,
                lap,
                today: today ?? localToday(),
                language,
              })
            : { kind: 'normal' as const };
        const baseLabel = label(day.dayNumber);
        const titleText =
          status.kind === 'done_other_day'
            ? t('programs.client.doneOnWeekday', { name: baseLabel, weekday: status.weekday })
            : baseLabel;

        return (
          <li
            key={day.dayNumber}
            aria-current={day.dayNumber === todayNumber ? 'date' : undefined}
            className={cn(
              'border-border flex flex-col border-b px-2 py-2 last:border-b-0',
              day.dayNumber === todayNumber ? 'bg-background rounded-xl' : null,
            )}
          >
            <span className="font-medium">
              {titleText}
              {day.dayNumber === todayNumber ? ` · ${t('programs.clientTab.today')}` : null}
              {status.kind === 'missed' ? ` · ${t('programs.client.missed')}` : null}
            </span>
            <span className={cn('text-sm', day.kind === 'rest' ? 'text-muted' : 'text-foreground')}>
              {summary(day)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
