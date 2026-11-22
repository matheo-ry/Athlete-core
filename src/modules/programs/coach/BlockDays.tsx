import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';

import type { ProgramBlock } from '../model/program-document';
import { useDayLabel, useDaySummary } from '../shared/useDayText';

interface BlockDaysProps {
  block: ProgramBlock;
  /** El día que toca hoy, marcado; vacío en modo lista o si aún no ha empezado. */
  todayNumber: number | null;
}

/** Los días de un bloque, en lectura, con su resumen (PR 2.14). */
export function BlockDays({ block, todayNumber }: BlockDaysProps) {
  const { t } = useTranslation();
  const label = useDayLabel(block);
  const summary = useDaySummary();

  return (
    <ul aria-label={t('programs.clientTab.daysLabel')}>
      {block.days.map((day) => (
        <li
          key={day.dayNumber}
          aria-current={day.dayNumber === todayNumber ? 'date' : undefined}
          className={cn(
            'border-border flex flex-col border-b px-2 py-2 last:border-b-0',
            day.dayNumber === todayNumber ? 'bg-background rounded-xl' : null,
          )}
        >
          <span className="font-medium">
            {label(day.dayNumber)}
            {day.dayNumber === todayNumber ? ` · ${t('programs.clientTab.today')}` : null}
          </span>
          <span className={cn('text-sm', day.kind === 'rest' ? 'text-muted' : 'text-foreground')}>
            {summary(day)}
          </span>
        </li>
      ))}
    </ul>
  );
}
