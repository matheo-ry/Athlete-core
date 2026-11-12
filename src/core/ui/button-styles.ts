import { cn } from '../lib';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const BASE =
  // min-h-11 = 44 px: zona táctil mínima (AGENTS.md §4).
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary-readable disabled:pointer-events-none disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-border bg-surface text-foreground hover:bg-background',
  ghost: 'text-foreground hover:bg-surface',
};

/** Clases de un botón. También sirve para enlaces que deben parecer un botón. */
export function buttonClassName(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(BASE, VARIANTS[variant], className);
}
