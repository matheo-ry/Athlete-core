import type { HTMLAttributes } from 'react';

import { cn } from '../lib';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `glass` sobre el fondo de la app; `float` cuando pasa por encima de algo
   * nítido (desenfoca lo de detrás); `photo` encima de una foto (texto blanco).
   */
  tone?: 'glass' | 'float' | 'photo';
}

const TONES: Record<NonNullable<CardProps['tone']>, string> = {
  glass: 'glass text-foreground',
  float: 'glass-float text-foreground',
  photo: 'glass-photo',
};

/** Panel de cristal: la superficie base de la app. */
export function Card({ tone = 'glass', className, ...rest }: CardProps) {
  return <div className={cn('rounded-panel p-5', TONES[tone], className)} {...rest} />;
}
