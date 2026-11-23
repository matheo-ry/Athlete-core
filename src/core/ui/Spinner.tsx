import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

interface SpinnerProps {
  /** Texto para lectores de pantalla. Por defecto, "Cargando…". */
  label?: string;
  className?: string;
}

/** Un arco del color del coach que gira sobre un aro tenue. */
export function Spinner({ label, className }: SpinnerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={label ?? t('core.ui.loading')}
      className={cn('flex items-center justify-center p-6', className)}
    >
      <span
        aria-hidden="true"
        className="border-border-strong border-t-primary-readable size-7 animate-spin rounded-full border-2"
      />
    </div>
  );
}
