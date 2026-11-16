import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';
import type { ExerciseOption } from '@/modules/exercises';

import type { ProgramDay, ProgramDayExercise } from '../model/program-document';
import { groupInfo } from '../model/supersets';
import { useExerciseSummary } from '../shared/useExerciseSummary';

interface ExerciseTabsProps {
  items: ProgramDayExercise[];
  byId: Map<string, ExerciseOption>;
  /** El día, para saber qué ejercicios van agrupados (PR 2.17). */
  day: ProgramDay;
  selected: number;
  onSelect: (index: number) => void;
}

/**
 * Los ejercicios del día como una fila de números, en su orden (D-106): se
 * toca uno y debajo se ve solo ese. Con muchos, la fila se desliza hacia los
 * lados. Quien usa lector de pantalla oye también el nombre y el resumen.
 */
export function ExerciseTabs({ items, byId, day, selected, onSelect }: ExerciseTabsProps) {
  const { t } = useTranslation();
  const summaryOf = useExerciseSummary();

  return (
    <ol
      aria-label={t('programs.editor.exercisesLabel')}
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {items.map((item, index) => {
        const exercise = byId.get(item.exerciseId);
        const group = groupInfo(day, index);
        return (
          <li key={item.id ?? `new-${String(index)}-${item.exerciseId}`} className="shrink-0">
            <button
              type="button"
              aria-current={index === selected ? true : undefined}
              onClick={() => onSelect(index)}
              className={cn(
                'min-h-11 min-w-11 rounded-lg px-3 text-sm font-semibold tabular-nums',
                'focus-visible:outline-primary-readable focus-visible:outline-2',
                index === selected ? 'bg-primary text-on-primary' : 'bg-background text-foreground',
                // Los de una superserie o un circuito llevan una raya debajo.
                group === null ? null : 'border-primary border-b-4',
              )}
            >
              {index + 1}
              <span className="sr-only">. {exercise?.name ?? '…'}</span>
              <span className="sr-only">{summaryOf(item)}</span>
              {group === null ? null : (
                <span className="sr-only">{t(`programs.supersets.${group.kind}`)}</span>
              )}
              {exercise?.isArchived === true ? (
                <span className="sr-only">{t('programs.editor.archived')}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
