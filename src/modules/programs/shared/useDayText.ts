import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';

import { dayCounts, weekdayName } from '../model/cycle-editor';
import type { ProgramBlock, ProgramDay } from '../model/program-document';

/** "Lunes" en un ciclo semanal; "Día 3" en los demás (D-075). */
export function useDayLabel(block: ProgramBlock | undefined) {
  const { t } = useTranslation();
  const language = useLanguage();
  return (dayNumber: number) =>
    (block === undefined ? null : weekdayName(block, dayNumber, language)) ??
    t('programs.editor.day', { number: dayNumber });
}

/** Lo que se ve de un día sin abrirlo: "Descanso", o su nombre, lugar, ejercicios y series. */
export function useDaySummary() {
  const { t } = useTranslation();
  return (day: ProgramDay) => {
    if (day.kind === 'rest') {
      return t('programs.editor.rest');
    }
    const counts = dayCounts(day);
    return [
      day.name,
      day.subtitle,
      day.place,
      t('programs.editor.exercises', { count: counts.exercises }),
      t('programs.editor.sets', { count: counts.sets }),
    ]
      .filter((part) => part !== null)
      .join(' · ');
  };
}
