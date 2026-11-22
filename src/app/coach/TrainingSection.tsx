import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { logger } from '@/core/lib';
import { INTENSITY_SCALES, useSaveTenantSettings, useTenantSettings } from '@/core/tenancy';
import type { IntensityScale } from '@/core/tenancy';
import { Card, segmentClassName, SEGMENTED_GROUP_CLASS } from '@/core/ui';

/**
 * "Entrenamiento", en los Ajustes del coach, solo para el dueño: con qué
 * escala de intensidad trabaja, RIR o RPE (D-076). Se guarda al elegir.
 * Cambiarla no convierte lo ya escrito en las rutinas.
 */
export function TrainingSection() {
  const { t } = useTranslation();
  const settings = useTenantSettings();
  const save = useSaveTenantSettings();
  const [failure, setFailure] = useState<string | null>(null);

  const choose = (intensityScale: IntensityScale) => {
    setFailure(null);
    save
      .mutateAsync({ intensityScale })
      .then((result) => {
        if (result !== 'ok') {
          setFailure(t(result === 'offline' ? 'core.errors.offline' : 'core.errors.unexpected'));
        }
      })
      .catch((error: unknown) => {
        logger.error('Could not save tenant settings', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setFailure(t('core.errors.unexpected'));
      });
  };

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('app.coachSettings.training.title')}</h2>
      <div
        role="group"
        aria-label={t('app.coachSettings.training.intensityLabel')}
        className="flex flex-col gap-1.5"
      >
        <span className="text-sm font-medium">
          {t('app.coachSettings.training.intensityLabel')}
        </span>
        <div className={SEGMENTED_GROUP_CLASS}>
          {INTENSITY_SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              aria-pressed={settings.intensityScale === scale}
              disabled={save.isPending}
              onClick={() => choose(scale)}
              className={segmentClassName(settings.intensityScale === scale)}
            >
              {t(`app.coachSettings.training.scales.${scale}`)}
            </button>
          ))}
        </div>
        <p className="text-muted text-sm">{t('app.coachSettings.training.intensityHint')}</p>
      </div>
      {failure !== null ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {failure}
        </p>
      ) : null}
    </Card>
  );
}
