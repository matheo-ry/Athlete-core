import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';

import type { ProgramBlock } from '../model/program-document';
import { useDayLabel, useDaySummary } from '../shared/useDayText';

interface DayListProps {
  block: ProgramBlock;
  selectedDay: number | null;
  onSelect: (dayNumber: number) => void;
}

/** Los días del ciclo, en orden. Al tocar uno, se abre (D-085). */
export function DayList({ block, selectedDay, onSelect }: DayListProps) {
  const { t } = useTranslation();
  const label = useDayLabel(block);
  const summary = useDaySummary();

  return (
    <ul aria-label={t('programs.editor.daysLabel')}>
      {block.days.map((day) => (
        <li key={day.dayNumber} className="border-border border-b last:border-b-0">
          <button
            type="button"
            aria-current={selectedDay === day.dayNumber ? true : undefined}
            onClick={() => onSelect(day.dayNumber)}
            className={cn(
              'flex min-h-14 w-full flex-col justify-center rounded-lg px-2 py-2 text-left',
              'hover:bg-background focus-visible:outline-primary-readable focus-visible:outline-2',
              selectedDay === day.dayNumber ? 'bg-background' : null,
            )}
          >
            <span className="font-medium">{label(day.dayNumber)}</span>
            <span className={cn('text-sm', day.kind === 'rest' ? 'text-muted' : 'text-foreground')}>
              {summary(day)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
