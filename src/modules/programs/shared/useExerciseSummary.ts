import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import { DEFAULT_WEIGHT_UNIT } from '@/core/lib';

import { prescriptionSummary } from '../model/prescription';
import type { ProgramDayExercise } from '../model/program-document';

/**
 * El resumen de una línea de un ejercicio (D-076), en el idioma y la unidad
 * del usuario. Sin nada prescrito, solo cuántas series tiene.
 */
export function useExerciseSummary() {
  const { t } = useTranslation();
  const language = useLanguage();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;

  return (item: ProgramDayExercise): string => {
    const summary = prescriptionSummary(item, {
      failureLabel: t('programs.prescription.failure'),
      unit,
      locale: language,
    });
    return summary === String(item.sets.length)
      ? t('programs.editor.sets', { count: item.sets.length })
      : summary;
  };
}
