import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

/**
 * Esqueletos de carga: la forma de lo que va a llegar, latiendo suave. Se
 * sienten más rápidos que un círculo girando porque la pantalla ya está
 * "montada". Llevan el mismo `role="status"` y nombre que `Spinner`.
 */
function Bar({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('bg-foreground/8 block rounded-full', className)} />
  );
}

/** Una tarjeta en carga: título y dos líneas. */
export function SkeletonCard({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t('core.ui.loading')}
      className={cn('surface flex animate-pulse flex-col gap-3 rounded-2xl p-4 md:p-5', className)}
    >
      <Bar className="h-3 w-24" />
      <Bar className="h-6 w-2/3" />
      <Bar className="h-3 w-1/2" />
    </div>
  );
}

/** Una lista en carga: filas con un círculo y dos líneas. */
export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t('core.ui.loading')}
      className={cn('flex animate-pulse flex-col gap-1 p-2', className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-1 py-2.5">
          <Bar className="size-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Bar className="h-3.5 w-1/2" />
            <Bar className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
