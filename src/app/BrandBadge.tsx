import { useState } from 'react';

import { brandInitials, logoUrl, pickReadableOn } from '@/core/branding';
import type { Brand } from '@/core/branding';
import { cn } from '@/core/lib';

interface BrandBadgeProps {
  brand: Brand;
  size?: 'sm' | 'lg';
  /**
   * Solo para la vista previa de la marca: la imagen elegida y aún sin guardar
   * (`null`: se acaba de quitar el logo). Si no se pasa, el logo guardado.
   */
  logoSrc?: string | null | undefined;
}

/**
 * El distintivo de un negocio (D-057): su logo o, si no tiene (o no carga), sus
 * iniciales sobre su color principal. Se pinta con los colores del negocio que
 * se le pasa, no con los del tema, porque puede no ser la marca activa (por
 * ejemplo, en una lista de espacios). El texto, blanco o negro: el que más
 * contraste dé (D-028). Es decoración: el nombre va siempre al lado.
 */
export function BrandBadge({ brand, size = 'sm', logoSrc }: BrandBadgeProps) {
  const saved = brand.logoPath === null ? null : logoUrl(brand.logoPath);
  const src = logoSrc === undefined ? saved : logoSrc;
  // La dirección que no se pudo cargar: para ella, las iniciales.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const sizeClass = size === 'sm' ? 'size-8 text-sm' : 'size-16 text-2xl';

  if (src !== null && src !== failedSrc) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        data-testid="brand-logo"
        onError={() => setFailedSrc(src)}
        className={cn('bg-surface shrink-0 rounded-lg object-contain', sizeClass)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      data-testid="brand-initials"
      style={{
        backgroundColor: brand.colors.primary,
        color: pickReadableOn(brand.colors.primary),
      }}
      className={cn('flex shrink-0 items-center justify-center rounded-lg font-bold', sizeClass)}
    >
      {brandInitials(brand.appName)}
    </span>
  );
}
