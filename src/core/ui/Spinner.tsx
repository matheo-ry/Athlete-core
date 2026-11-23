import { useTranslation } from 'react-i18next';

import { cn } from '../lib';

interface SpinnerProps {
  /** Texto para lectores de pantalla. Por defecto, "Cargando…". */
  label?: string;
  className?: string;
}

/** Un arco de luz del color del coach que gira sobre su pista de cristal. */
export function Spinner({ label, className }: SpinnerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={label ?? t('core.ui.loading')}
      className={cn('flex items-center justify-center p-8', className)}
    >
      <span
        aria-hidden="true"
        className="border-hairline-strong border-t-primary block size-7 animate-[spin-arc_0.8s_linear_infinite] rounded-full border-[2.5px]"
      />
    </div>
  );
}
