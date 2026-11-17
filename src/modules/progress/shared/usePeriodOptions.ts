import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProgressPeriod } from '../model/progress-charts';
import type { ChoiceOption } from './ChoiceChips';

/** Opciones del selector de periodo, traducidas (D-129). */
export function usePeriodOptions(): ChoiceOption<ProgressPeriod>[] {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { key: '4w', label: t('progress.period.fourWeeks') },
      { key: '3m', label: t('progress.period.threeMonths') },
      { key: 'all', label: t('progress.period.all') },
    ],
    [t],
  );
}
