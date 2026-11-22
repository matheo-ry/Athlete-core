import { cn } from '../lib';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none ' +
  'transition-[transform,background-color,box-shadow,opacity] duration-200 ' +
  // Al pulsar, el botón se hunde un poco: confirma el toque sin esperar a la red.
  'active:scale-[0.97] focus-ring disabled:pointer-events-none disabled:opacity-45';

// min-h-11 = 44 px y min-h-14 = 56 px: zonas táctiles (AGENTS.md §4).
const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-14 px-7 text-base',
};

const VARIANTS: Record<ButtonVariant, string> = {
  // El color del coach, con un reflejo arriba y un resplandor suave debajo.
  primary:
    'bg-primary text-on-primary hover:brightness-110 ' +
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_10px_28px_-10px_var(--color-primary-glow)]',
  secondary: 'surface-raised text-foreground hover:bg-raised hover:border-border-strong',
  ghost: 'text-foreground hover:bg-foreground/8',
  // Lo que no tiene vuelta atrás: descartar, borrar.
  danger: 'bg-danger text-background hover:brightness-110',
};

/** Clases de un botón. También sirve para enlaces que deben parecer un botón. */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  className?: string,
  size: ButtonSize = 'md',
): string {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}
