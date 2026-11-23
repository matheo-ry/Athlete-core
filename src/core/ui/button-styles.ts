import { cn } from '../lib';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const BASE =
  // min-h-11 = 44 px: zona táctil mínima (AGENTS.md §4).
  'focus-ring relative inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'select-none transition-[transform,background-color,box-shadow,opacity] duration-200 ' +
  'ease-[var(--ease-out-expo)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45';

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-14 px-7 text-base tracking-[-0.01em]',
};

// La principal es una pieza de luz del color del coach: un brillo arriba, un
// halo de su color debajo. El resto es cristal o texto.
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_-1px_0_rgb(0_0_0/0.15),0_10px_30px_-10px_var(--color-primary-glow)] hover:brightness-110',
  secondary: 'glass text-foreground hover:bg-glass-hover',
  ghost: 'text-foreground hover:bg-glass',
  danger:
    'bg-danger text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_10px_26px_-12px_var(--brand-danger)] hover:brightness-110',
};

/** Clases de un botón. También sirve para enlaces que deben parecer un botón. */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  className?: string,
  size: ButtonSize = 'md',
): string {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}
