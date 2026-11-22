import { cn } from '../lib';

/**
 * Aspecto común de los campos de texto. Más hundidos que la tarjeta que los
 * contiene (fondo de la pantalla, sombra interior) para que se lean como "aquí
 * se escribe", y con un halo del color del coach al enfocarlos.
 */
export function fieldClassName(hasError: boolean, className?: string): string {
  return cn(
    'bg-background text-foreground min-h-12 w-full rounded-xl border px-4 text-base',
    'shadow-[inset_0_1px_2px_rgb(0_0_0/0.18)] transition-[border-color,box-shadow] duration-200',
    'placeholder:text-muted/70 focus-visible:outline-none',
    hasError
      ? 'border-danger focus-visible:ring-danger-soft focus-visible:ring-4'
      : 'border-border-strong focus-visible:border-primary-readable focus-visible:ring-primary-soft focus-visible:ring-4',
    className,
  );
}

export const FIELD_LABEL_CLASS = 'text-foreground text-sm font-medium';
