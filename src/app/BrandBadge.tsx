import { brandInitials, pickReadableOn } from '@/core/branding';
import type { Brand } from '@/core/branding';
import { cn } from '@/core/lib';

interface BrandBadgeProps {
  brand: Brand;
  size?: 'sm' | 'lg';
}

/**
 * El distintivo de un negocio: sus iniciales sobre su color principal (D-057).
 * El logo llega en el PR 1.16. Se pinta con los colores del negocio que se le
 * pasa, no con los del tema, porque puede no ser la marca activa (por ejemplo,
 * en una lista de espacios). El texto, blanco o negro: el que más contraste dé
 * (D-028).
 */
export function BrandBadge({ brand, size = 'sm' }: BrandBadgeProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        backgroundColor: brand.colors.primary,
        color: pickReadableOn(brand.colors.primary),
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg font-bold',
        size === 'sm' ? 'size-8 text-sm' : 'size-16 text-2xl',
      )}
    >
      {brandInitials(brand.appName)}
    </span>
  );
}
