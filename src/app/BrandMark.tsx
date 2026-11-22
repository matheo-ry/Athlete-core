import { useBrand } from '@/core/branding';

import { BrandBadge } from './BrandBadge';

/**
 * La marca que se está mostrando (la del coach o la de la plataforma) en la
 * cabecera: su logo, o sus iniciales si no tiene, y su nombre.
 */
export function BrandMark() {
  const brand = useBrand();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <BrandBadge brand={brand} />
      <span className="text-foreground truncate text-base font-semibold tracking-tight">
        {brand.appName}
      </span>
    </div>
  );
}
