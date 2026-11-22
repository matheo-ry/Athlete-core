import type { HTMLAttributes } from 'react';

import { cn } from '../lib';

type PillTone = 'neutral' | 'primary' | 'accent' | 'danger';

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

const TONES: Record<PillTone, string> = {
  neutral: 'bg-foreground/8 text-muted',
  primary: 'bg-primary-soft text-primary-readable',
  accent: 'bg-accent-soft text-foreground',
  danger: 'bg-danger-soft text-danger',
};

/** Chip pequeño para un estado o una etiqueta: "Activa", "Nuevo", "Archivada". */
export function Pill({ tone = 'neutral', className, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        'eyebrow inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 leading-none',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
