import type { ReactNode } from 'react';

import { cn } from '@/core/lib';

interface ProgressStatProps {
  label: string;
  children: ReactNode;
  /** Color de la cifra: subir es buena noticia (`up`); bajar, aviso (`down`). */
  tone?: 'neutral' | 'up' | 'down';
  testId?: string;
}

const TONES = {
  neutral: 'text-foreground',
  up: 'text-primary-readable',
  down: 'text-accent',
} as const;

/**
 * Una cifra de progreso en su baldosa: etiqueta pequeña en mono y la cifra
 * grande.
 */
export function ProgressStat({ label, children, tone = 'neutral', testId }: ProgressStatProps) {
  return (
    <div
      className="bg-background/60 border-border flex min-w-0 flex-col gap-1.5 rounded-2xl border px-3 py-2.5"
      data-testid={testId}
    >
      <span className="eyebrow truncate">{label}</span>
      <span className={cn('numeric truncate text-xl font-medium', TONES[tone])}>{children}</span>
    </div>
  );
}
