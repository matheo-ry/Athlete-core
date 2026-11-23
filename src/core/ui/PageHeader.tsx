import type { ReactNode } from 'react';

import { cn } from '../lib';

interface PageHeaderProps {
  title: string;
  /** Línea pequeña en mayúsculas encima del título (fecha, sección…). */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Botones a la derecha del título en escritorio; debajo en el móvil. */
  actions?: ReactNode;
  /** Encima de una foto: texto blanco en los dos modos. */
  onPhoto?: boolean;
  className?: string;
}

/**
 * Cabecera de una pantalla (D-prime1-5): un titular grande en Hubot Sans, que
 * hace de identidad de la app en vez de una barra con el nombre.
 */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  onPhoto = false,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'animate-enter flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-3">
        {eyebrow ? (
          <p className={cn('eyebrow', onPhoto ? 'text-on-photo-muted' : 'text-muted')}>{eyebrow}</p>
        ) : null}
        <h1
          className={cn(
            'display text-[2.75rem] break-words sm:text-6xl',
            onPhoto ? 'text-on-photo' : 'text-foreground',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className={cn('max-w-xl text-base', onPhoto ? 'text-on-photo-muted' : 'text-muted')}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
