import { cn } from '../lib';

/**
 * Aspecto común de un campo (texto, número, desplegable, área de texto): una
 * ranura de cristal hundida que se ilumina con el color del coach al enfocarla.
 * Lo usan `Input`, `PasswordInput` y los campos propios de los módulos.
 */
export function fieldClassName(hasError = false, className?: string): string {
  return cn(
    'min-h-12 w-full rounded-control bg-glass px-4 text-base text-foreground',
    'shadow-[inset_0_1px_2px_rgb(0_0_0/0.18),inset_0_0_0_1px_var(--color-hairline)]',
    'placeholder:text-muted transition-[box-shadow,background-color] duration-200 outline-none',
    'hover:bg-glass-strong focus-visible:bg-glass-strong',
    'focus-visible:shadow-[inset_0_0_0_1.5px_var(--brand-primary-readable),0_0_0_5px_var(--color-primary-soft)]',
    'disabled:opacity-50',
    hasError && 'shadow-[inset_0_0_0_1.5px_var(--brand-danger)]',
    className,
  );
}

/** La etiqueta de un campo: pequeña y clara, encima. */
export const FIELD_LABEL_CLASS = 'text-foreground/85 text-sm font-medium';
