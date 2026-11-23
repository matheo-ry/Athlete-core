import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../lib';

import { StateOrbit } from './StateOrbit';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Botón o enlace para salir del estado vacío (por ejemplo, "Crear rutina"). */
  action?: ReactNode;
  className?: string;
}

/** Estado "vacío" de una pantalla con datos: no hay nada todavía. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'animate-rise flex flex-col items-center gap-2 px-4 py-10 text-center',
        className,
      )}
    >
      <StateOrbit>
        <Inbox className="text-primary-readable size-7" strokeWidth={1.6} />
      </StateOrbit>
      <p className="text-foreground mt-3 text-lg font-semibold">{title}</p>
      {description ? <p className="text-muted max-w-sm text-sm leading-6">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
