import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

interface SpinnerProps {
  /** Texto para lectores de pantalla. Por defecto, "Cargando…". */
  label?: string;
  className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={label ?? t('core.ui.loading')}
      className={cn('text-muted flex items-center justify-center p-6', className)}
    >
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
    </div>
  );
}
