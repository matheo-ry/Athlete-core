import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useProfile } from '@/core/auth';
import { useLanguage } from '@/core/i18n';
import { DEFAULT_WEIGHT_UNIT, formatWeight } from '@/core/lib';
import { Card, Spinner, buttonClassName } from '@/core/ui';
import { shortDate } from '@/modules/programs';

import { useOwnHealthData } from '../api/useBodyData';

/**
 * Peso corporal en el inicio del cliente (D-127): el último ("85 kg · apuntado
 * el 16 nov"), "Actualizar" y la entrada a las medidas. Sin peso, invita a
 * apuntarlo. Los cuatro estados: cargando, vacío, error y con datos.
 */
export function BodyWeightCard() {
  const { t } = useTranslation();
  const language = useLanguage();
  const unit = useProfile().data?.weightUnit ?? DEFAULT_WEIGHT_UNIT;
  const { latest, isPending, isError, refetch } = useOwnHealthData();

  return (
    <Card className="flex flex-col gap-4" data-testid="body-weight-card">
      <p className="eyebrow">{t('workouts.body.card.title')}</p>
      {isPending ? (
        <Spinner />
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-muted text-sm">{t('core.errors.unexpected')}</p>
          <button
            type="button"
            className={buttonClassName('secondary')}
            onClick={() => {
              refetch();
            }}
          >
            {t('core.ui.retry')}
          </button>
        </div>
      ) : (
        <p className="text-lg font-semibold" data-testid="body-weight-card-last">
          {latest === null
            ? t('workouts.body.weight.none')
            : t('workouts.body.weight.last', {
                weight: formatWeight(latest.weight_kg, unit, language),
                date: shortDate(latest.measured_on, language),
              })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Link to="/client/body" className={buttonClassName('primary')}>
          {latest === null ? t('workouts.body.weight.add') : t('workouts.body.weight.update')}
        </Link>
        <Link to="/client/body?tab=measurements" className={buttonClassName('secondary')}>
          {t('workouts.body.card.measurements')}
        </Link>
      </div>
    </Card>
  );
}
