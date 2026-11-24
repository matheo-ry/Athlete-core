import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { DEFAULT_WEIGHT_UNIT, cn, formatWeight, fromKg } from '@/core/lib';
import { useLanguage } from '@/core/i18n';

import { useLatestBodyWeightKg } from '../api/useBodyData';
import { totalWithBallast } from '../model/body-weight';

interface BallastTotalProps {
  /** El lastre apuntado, o el de referencia (gris) si aún no hay nada; `null` si no hay ninguno. */
  ballastKg: number | null;
  /** Viene de la referencia, no de lo apuntado: se enseña atenuado como el campo. */
  isReference: boolean;
  className?: string;
}

/**
 * "Lastre 10 · Total 95 kg" (D-127): en un ejercicio de peso corporal, lo que
 * se mueve en total. Solo sale con el consentimiento dado y un peso apuntado
 * (D-126); sin ellos, el lastre se queda solo, como antes.
 */
export function BallastTotal({ ballastKg, isReference, className }: BallastTotalProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const bodyKg = useLatestBodyWeightKg();
  const total = totalWithBallast(bodyKg, ballastKg);

  if (total === null || ballastKg === null) {
    return null;
  }
  return (
    <p
      data-testid="ballast-total"
      className={cn(
        'numeric px-1 text-sm',
        isReference ? 'text-muted' : 'text-foreground',
        className,
      )}
    >
      {t('workouts.set.ballastTotal', {
        ballast: Number(fromKg(ballastKg, unit).toFixed(1)),
        total: formatWeight(total, unit, language),
      })}
    </p>
  );
}
