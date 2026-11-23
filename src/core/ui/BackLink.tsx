import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { To } from 'react-router';

import { cn } from '../lib';

interface BackLinkProps {
  to: To;
  children: ReactNode;
  replace?: boolean;
  /** `photo` encima de una foto (cristal oscuro y texto blanco). */
  tone?: 'float' | 'photo';
  className?: string;
}

/**
 * "Volver" (D-prime2-3): una píldora de cristal con su flecha, arriba a la
 * izquierda. Si el texto ya empieza por "←" (textos antiguos), no repite la flecha.
 */
export function BackLink({ to, children, replace, tone = 'float', className }: BackLinkProps) {
  const hasArrow = typeof children === 'string' && children.trimStart().startsWith('←');
  const label = hasArrow ? children.trimStart().slice(1).trimStart() : children;

  return (
    <Link
      to={to}
      replace={replace}
      aria-label={typeof children === 'string' ? children : undefined}
      className={cn(
        'focus-ring inline-flex min-h-11 items-center gap-1 self-start rounded-full pr-4 pl-2.5 text-sm font-semibold',
        tone === 'photo' ? 'glass-photo' : 'glass-float text-foreground',
        'transition-transform duration-200 active:scale-[0.97]',
        className,
      )}
    >
      <ChevronLeft aria-hidden="true" className="size-5" />
      <span>{label}</span>
    </Link>
  );
}
