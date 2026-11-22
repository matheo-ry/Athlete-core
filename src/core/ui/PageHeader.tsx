import type { ReactNode } from 'react';

import { cn } from '../lib';

interface PageHeaderProps {
  title: string;
  /** Línea pequeña y monoespaciada sobre el título: la sección, la fecha… */
  eyebrow?: string;
  description?: string;
  /** Botón o enlace a la derecha del título (por ejemplo, "Nuevo cliente"). */
  action?: ReactNode;
  className?: string;
}

/** Cabecera de una pantalla: un título grande con aire y, opcionalmente, su contexto. */
export function PageHeader({ title, eyebrow, description, action, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-end justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="text-3xl leading-[1.05] font-semibold md:text-4xl">{title}</h1>
        {description ? <p className="text-muted max-w-prose text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
