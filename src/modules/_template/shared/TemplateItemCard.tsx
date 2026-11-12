import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { DEFAULT_WEIGHT_UNIT, formatWeight } from '@/core/lib';
import { Card } from '@/core/ui';

import type { TemplateItem } from '../model/template-item-schema';

interface TemplateItemCardProps {
  item: TemplateItem;
}

export function TemplateItemCard({ item }: TemplateItemCardProps) {
  const { t } = useTranslation();
  const language = useLanguage();

  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        {/* El nombre lo escribe el coach: no se traduce (ARQUITECTURA §11). */}
        <p className="font-semibold">{item.name}</p>
        <p className="text-muted text-sm">
          {t('template.items.setsReps', { sets: item.sets, reps: item.reps })}
        </p>
      </div>
      <p className="text-primary-readable font-semibold">
        {formatWeight(item.weightKg, DEFAULT_WEIGHT_UNIT, language)}
      </p>
    </Card>
  );
}
