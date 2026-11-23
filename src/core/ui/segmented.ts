import { cn } from '../lib';

/**
 * Control segmentado (D-prime2-2): una ranura de cristal con las opciones y una
 * lente iluminada en la elegida. Lo usan las pestañas y las opciones de dos o
 * tres valores (kg/lb, RIR/RPE, Activos/Archivados…). El grupo lleva
 * `role="group"` o `role="tablist"` donde lo pone cada pantalla.
 */
export const SEGMENTED_GROUP_CLASS =
  'bg-glass inline-flex max-w-full flex-wrap gap-1 rounded-[1.6rem] p-1 shadow-[inset_0_0_0_1px_var(--color-hairline)]';

/** Una opción del control segmentado. 44 px de alto (AGENTS.md §4). */
export function segmentClassName(active: boolean, className?: string): string {
  return cn(
    'focus-ring min-h-11 rounded-full px-4 text-sm font-semibold whitespace-nowrap',
    'transition-[color,background-color,box-shadow] duration-300',
    active
      ? 'bg-glass-strong text-foreground shadow-[var(--glass-edge),0_6px_18px_-10px_var(--color-primary-glow)]'
      : 'text-muted hover:text-foreground',
    className,
  );
}
