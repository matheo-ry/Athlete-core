import { CircleDashed } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../lib';

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
    <div className={cn('flex flex-col items-center gap-3 px-4 py-12 text-center', className)}>
      <span className="glass text-primary-readable flex size-14 items-center justify-center rounded-full">
        <CircleDashed aria-hidden="true" className="size-6" strokeWidth={1.6} />
      </span>
      <p className="display text-foreground mt-2 text-2xl">{title}</p>
      {description ? <p className="text-muted max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
