import { useId } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../lib';

interface ProgressRingProps {
  value: number;
  max: number;
  /** Diámetro en píxeles. */
  size?: number;
  /** Grosor del anillo en píxeles. */
  stroke?: number;
  /** Lo que va en el centro (una cifra, un tick…). */
  children?: ReactNode;
  className?: string;
}

/**
 * Anillo de progreso: una pista de cristal y un arco de luz que va del color
 * principal del coach a su acento. Decorativo: la cifra va siempre en texto.
 */
export function ProgressRing({
  value,
  max,
  size = 56,
  stroke = 6,
  children,
  className,
}: ProgressRingProps) {
  const gradientId = useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true" width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" />
            <stop offset="100%" stopColor="var(--brand-accent)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-hairline-strong)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out-expo)]"
          style={{ opacity: ratio === 0 ? 0 : 1 }}
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}
