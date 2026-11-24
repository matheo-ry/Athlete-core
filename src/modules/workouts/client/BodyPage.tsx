import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ErrorState, PageHeader, SEGMENTED_GROUP_CLASS, segmentClassName } from '@/core/ui';

import { useOwnHealthData } from '../api/useBodyData';
import { MeasurementsPanel } from './MeasurementsPanel';
import { WeightPanel } from './WeightPanel';

const TABS = ['weight', 'measurements'] as const;
type Tab = (typeof TABS)[number];

function tabFrom(value: string | null): Tab {
  return value === 'measurements' ? 'measurements' : 'weight';
}

// Los paneles no se desmontan mientras llegan los datos: al dar el permiso al
// guardar, el formulario sigue ahí con lo escrito y su aviso.
/**
 * Peso corporal y medidas del cliente (`/client/body`, D-127). Funciona en la
 * app y en la web: apuntar un peso no es entrenar (D-116). El consentimiento de
 * datos de salud se pide al guardar si aún no está dado (D-126).
 */
export function BodyPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = tabFrom(params.get('tab'));
  const health = useOwnHealthData();

  return (
    <section className="flex flex-col gap-5">
      <PageHeader eyebrow={t('workouts.body.eyebrow')} title={t('workouts.body.title')} />
      <div role="group" aria-label={t('workouts.body.tabsLabel')} className={SEGMENTED_GROUP_CLASS}>
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={tab === item}
            className={segmentClassName(tab === item)}
            onClick={() => {
              setParams(item === 'weight' ? {} : { tab: item }, { replace: true });
            }}
          >
            {t(item === 'weight' ? 'workouts.body.tabWeight' : 'workouts.body.tabMeasurements')}
          </button>
        ))}
      </div>
      {health.isError ? (
        <ErrorState onRetry={health.refetch} />
      ) : tab === 'weight' ? (
        <WeightPanel health={health} />
      ) : (
        <MeasurementsPanel health={health} />
      )}
    </section>
  );
}
