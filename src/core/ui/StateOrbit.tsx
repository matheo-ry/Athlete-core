import type { ReactNode } from 'react';

import { cn } from '../lib';

interface StateOrbitProps {
  children: ReactNode;
  /** `danger` tiñe el halo de rojo: errores. */
  tone?: 'default' | 'danger';
}

/**
 * Motivo gráfico de la app para los estados vacíos y de error: un icono dentro
 * de dos órbitas finas con unas burbujas del color del acento. Está hecho con
 * CSS (nada de imágenes), así que toma el color de cada coach.
 */
export function StateOrbit({ children, tone = 'default' }: StateOrbitProps) {
  const isDanger = tone === 'danger';

  return (
    <div aria-hidden="true" className="relative flex size-32 items-center justify-center">
      <span className="border-border-strong/70 absolute inset-0 rounded-full border border-dashed" />
      <span className="border-border absolute inset-4 rounded-full border" />
      <span
        className={cn(
          'absolute inset-[26px] rounded-full blur-xl',
          isDanger ? 'bg-danger-soft' : 'bg-primary-soft',
        )}
      />
      <span className="surface-raised relative flex size-16 items-center justify-center rounded-full">
        {children}
      </span>
      <span className="bg-accent absolute top-3 right-4 size-2.5 rounded-full" />
      <span className="bg-accent/60 absolute top-9 right-0 size-1.5 rounded-full" />
      <span className="bg-accent/40 absolute bottom-4 left-2 size-2 rounded-full" />
    </div>
  );
}
