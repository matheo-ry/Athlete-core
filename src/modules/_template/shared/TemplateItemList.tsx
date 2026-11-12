import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { DEFAULT_WEIGHT_UNIT, formatWeight } from '@/core/lib';
import { EmptyState, ErrorState, Spinner } from '@/core/ui';

import { useTemplateItems } from '../api/useTemplateItems';
import { calculateTotalVolumeKg } from '../model/template-volume';

import { TemplateItemCard } from './TemplateItemCard';

/** Ejemplo de los 4 estados de una pantalla con datos: cargando, error, vacío y con datos. */
export function TemplateItemList() {
  const { t } = useTranslation();
  const language = useLanguage();
  const { data, isPending, isError, refetch } = useTemplateItems();

  if (isPending) {
    return <Spinner />;
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={t('template.items.emptyTitle')}
        description={t('template.items.emptyDescription')}
      />
    );
  }

  const totalVolume = formatWeight(calculateTotalVolumeKg(data), DEFAULT_WEIGHT_UNIT, language);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {data.map((item) => (
          <li key={item.id}>
            <TemplateItemCard item={item} />
          </li>
        ))}
      </ul>
      <p className="text-muted text-sm">
        {t('template.items.totalVolume', { volume: totalVolume })}
      </p>
    </div>
  );
}
