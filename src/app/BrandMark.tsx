import { useBrand } from '@/core/branding';
import { cn } from '@/core/lib';

import { BrandBadge } from './BrandBadge';

interface BrandMarkProps {
  /** `chip`: píldora de cristal flotante (móvil). `plain`: en el menú lateral. */
  variant?: 'chip' | 'plain';
}

/**
 * La marca que se está mostrando (la del coach o la de la plataforma): su logo,
 * o sus iniciales si no tiene, y su nombre.
 */
export function BrandMark({ variant = 'plain' }: BrandMarkProps) {
  const brand = useBrand();

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2.5',
        variant === 'chip' && 'glass-float h-11 rounded-full pr-4 pl-1.5',
      )}
    >
      <BrandBadge brand={brand} round={variant === 'chip'} />
      <span
        className={cn(
          'text-foreground truncate font-semibold',
          variant === 'chip' ? 'text-sm' : 'display text-lg',
        )}
      >
        {brand.appName}
      </span>
    </div>
  );
}
