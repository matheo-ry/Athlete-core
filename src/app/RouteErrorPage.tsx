import { useEffect } from 'react';
import { useRouteError } from 'react-router';

import { logger } from '@/core/lib';
import { ErrorState } from '@/core/ui';

/**
 * Lo que se ve cuando una pantalla falla al cargar o al pintarse (por ejemplo,
 * sin conexión al abrir una pantalla que se descarga bajo demanda). Evita que el
 * usuario vea un error técnico en crudo: mensaje traducido, botón para recargar
 * y el detalle al logger (AGENTS.md §4, "Errores y registro").
 */
export function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    logger.error('A screen failed to load or render', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }, [error]);

  return (
    <div className="text-foreground flex min-h-dvh flex-col items-center justify-center px-5">
      <ErrorState onRetry={() => window.location.reload()} />
    </div>
  );
}
