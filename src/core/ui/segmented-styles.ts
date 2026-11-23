import { cn } from '../lib';

/**
 * Control segmentado: una píldora hundida con los botones dentro y el elegido
 * encendido con el color del coach. Sirve para pestañas ("Activos" y
 * "Archivados") y para elegir una opción entre pocas (kg o lb, claro u oscuro).
 * Los botones llevan `aria-pressed`; esto es solo el aspecto.
 */
export const SEGMENTED_GROUP_CLASS =
  'bg-foreground/6 inline-flex max-w-full flex-wrap gap-0.5 self-start rounded-3xl p-1';

export function segmentClassName(isActive: boolean, className?: string): string {
  return cn(
    'focus-ring flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold',
    'transition-[background-color,color,box-shadow] duration-200',
    isActive
      ? 'bg-primary text-on-primary shadow-[0_6px_16px_-8px_var(--color-primary-glow)]'
      : 'text-muted hover:text-foreground',
    className,
  );
}
