import { useBrand } from '@/core/branding';

import { BrandBadge } from './BrandBadge';

/**
 * Nombre de la marca que se está mostrando (la del coach o la de la plataforma),
 * con sus iniciales. El logo llega en el PR 1.16.
 */
export function BrandMark() {
  const brand = useBrand();

  return (
    <div className="flex items-center gap-2">
      <BrandBadge brand={brand} />
      <span className="text-foreground font-semibold">{brand.appName}</span>
    </div>
  );
}
