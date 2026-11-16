import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';

import type { RoutineProgress } from '../model/assignments';

/** Una fecha "AAAA-MM-DD" corta, sin mover el día por la zona horaria. */
export function shortDate(date: string, language: string): string {
  return formatDate(`${date}T00:00:00Z`, language, 'UTC');
}

/**
 * Por dónde va una rutina, en una línea (D-108): "Bloque 2 de 3 · Semana 2 de
 * 4 · Termina el 6 dic 2026", o el aviso de que ya terminó y se repite.
 */
export function useProgressText() {
  const { t } = useTranslation();
  const language = useLanguage();

  return (value: RoutineProgress): string => {
    const parts: string[] = [];
    if (value.blockCount > 1) {
      parts.push(
        t('programs.assigned.block', { number: value.blockNumber, count: value.blockCount }),
      );
    }
    if (value.isRepeating) {
      parts.push(t('programs.assigned.repeating'));
      return parts.join(' · ');
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
    return parts.join(' · ');
  };
}
