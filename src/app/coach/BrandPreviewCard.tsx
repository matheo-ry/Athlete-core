import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { brandToCssVars } from '@/core/branding';
import type { Brand } from '@/core/branding';

import { BrandBadge } from '../BrandBadge';

interface BrandPreviewCardProps {
  brand: Brand;
}

/**
 * La vista previa de la marca antes de guardar (D-057): un trozo de la app del
 * cliente pintado con la marca que se está editando, con la misma corrección
 * de contraste que la app de verdad. Solo cambia este recuadro: el resto de la
 * app sigue con la marca guardada hasta pulsar "Guardar".
 */
export function BrandPreviewCard({ brand }: BrandPreviewCardProps) {
  const { t } = useTranslation();
  // Las clases de color (bg-primary, text-foreground…) leen estas variables.
  const style = { ...brandToCssVars(brand), colorScheme: brand.mode } as CSSProperties;

  return (
    <div
      role="group"
      aria-label={t('app.brand.previewLabel')}
      data-testid="brand-preview"
      style={style}
      className="bg-background text-foreground border-border overflow-hidden rounded-lg border"
    >
      <div className="bg-surface border-border flex items-center gap-3 border-b p-3">
        <BrandBadge brand={brand} />
        <span className="font-semibold">{brand.appName}</span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{t('app.brand.previewTitle')}</span>
          <span className="bg-accent text-on-accent rounded-full px-2 py-0.5 text-xs font-semibold">
            {t('app.brand.previewBadge')}
          </span>
        </div>
        <p className="text-muted text-sm">{t('app.brand.previewText')}</p>
        <span className="bg-primary text-on-primary flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold">
          {t('app.brand.previewButton')}
        </span>
        <span className="text-primary-readable text-sm font-medium underline">
          {t('app.brand.previewLink')}
        </span>
      </div>
    </div>
  );
}
