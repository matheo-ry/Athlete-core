import { useBrand } from '@/core/branding';

/**
 * Nombre de la marca que se está mostrando (la del coach o la de la plataforma).
 * El logo llegará en la Fase 1, cuando exista Storage; mientras, la inicial.
 */
export function BrandMark() {
  const brand = useBrand();

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-primary text-on-primary flex size-8 items-center justify-center rounded-lg text-sm font-bold"
      >
        {brand.appName.charAt(0).toUpperCase()}
      </span>
      <span className="text-foreground font-semibold">{brand.appName}</span>
    </div>
  );
}
