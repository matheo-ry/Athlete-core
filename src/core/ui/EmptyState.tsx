import { Inbox } from 'lucide-react';
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
    <div className={cn('flex flex-col items-center gap-2 px-4 py-10 text-center', className)}>
      <Inbox aria-hidden="true" className="text-muted size-8" />
      <p className="text-foreground font-semibold">{title}</p>
      {description ? <p className="text-muted max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
