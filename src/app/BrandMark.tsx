import { useBrand } from '@/core/branding';

import { BrandBadge } from './BrandBadge';

/**
 * La marca que se está mostrando (la del coach o la de la plataforma) en la
 * cabecera: su logo, o sus iniciales si no tiene, y su nombre.
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
