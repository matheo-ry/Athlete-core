import { useTranslation } from 'react-i18next';

import { SEGMENTED_GROUP_CLASS, segmentClassName } from '@/core/ui';

import { useUpdateProfile } from '@/core/auth';
import { WEIGHT_UNITS } from '@/core/lib';
import type { WeightUnit } from '@/core/lib';

interface WeightUnitChoiceProps {
  value: WeightUnit;
}

const LABEL_KEYS: Record<WeightUnit, string> = {
  kg: 'app.account.unitKg',
  lb: 'app.account.unitLb',
};

/**
 * Kilos o libras (D-010 y D-058). Se guarda al momento. Los pesos se guardan
 * siempre en kg: esto solo cambia cómo se ven. Si no se puede guardar, vuelve
 * a la de antes y lo dice.
 */
export function WeightUnitChoice({ value }: WeightUnitChoiceProps) {
  const { t } = useTranslation();
  const update = useUpdateProfile();
  const failure = update.data?.ok === false ? update.data.reason : null;

  return (
    <div role="group" aria-label={t('app.account.unitLabel')} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{t('app.account.unitLabel')}</span>
      <div className={SEGMENTED_GROUP_CLASS}>
        {WEIGHT_UNITS.map((unit) => (
          <button
            key={unit}
            type="button"
            aria-pressed={value === unit}
            onClick={() => update.mutate({ weightUnit: unit })}
            className={segmentClassName(value === unit)}
          >
            {t(LABEL_KEYS[unit])}
          </button>
        ))}
      </div>
      {failure !== null ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {t(failure === 'offline' ? 'core.errors.offline' : 'core.errors.unexpected')}
        </p>
      ) : null}
    </div>
  );
}
