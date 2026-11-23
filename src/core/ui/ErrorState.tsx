import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

import { Button } from './Button';
import { StateOrbit } from './StateOrbit';

interface ErrorStateProps {
  /** Por defecto, un mensaje genérico traducido. */
  title?: string;
  description?: string;
  /** Si se pasa, aparece el botón "Reintentar". */
  onRetry?: () => void;
  className?: string;
}

/** Estado "error" de una pantalla con datos. El detalle técnico va al logger, no aquí. */
export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={cn(
        'animate-rise flex flex-col items-center gap-2 px-4 py-10 text-center',
        className,
      )}
    >
      <StateOrbit tone="danger">
        <TriangleAlert className="text-danger size-7" strokeWidth={1.6} />
      </StateOrbit>
      <p className="text-foreground mt-3 text-lg font-semibold">
        {title ?? t('core.ui.errorTitle')}
      </p>
      <p className="text-muted max-w-sm text-sm leading-6">
        {description ?? t('core.ui.errorDescription')}
      </p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-3">
          {t('core.ui.retry')}
        </Button>
      ) : null}
    </div>
  );
}
