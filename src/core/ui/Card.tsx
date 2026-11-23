import type { HTMLAttributes } from 'react';

import { cn } from '../lib';

type CardTone = 'default' | 'raised' | 'accent';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `default`: superficie normal. `raised`: una capa por encima. `accent`: tintada
   * con el color del coach, para lo que toca hoy o lo más importante de la pantalla.
   */
  tone?: CardTone;
}

const TONES: Record<CardTone, string> = {
  default: 'surface',
  raised: 'surface-raised',
  accent: 'surface-accent',
};

export function Card({ tone = 'default', className, ...rest }: CardProps) {
  return (
    <div
      className={cn('text-foreground rounded-2xl p-4 md:p-5', TONES[tone], className)}
      {...rest}
    />
  );
}
