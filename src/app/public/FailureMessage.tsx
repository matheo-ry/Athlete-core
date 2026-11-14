import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { failureMessageKey } from '@/core/auth';
import type { AuthFailureReason } from '@/core/auth';

interface FailureMessageProps {
  reason: AuthFailureReason | null;
  /** La salida que toca, resaltada junto al mensaje (D-043). */
  action?: ReactNode;
}

/** El mensaje de un fallo de cuenta, para lectores de pantalla también. */
export function FailureMessage({ reason, action }: FailureMessageProps) {
  const { t } = useTranslation();
  if (reason === null) {
    return null;
  }
  return (
    <div className="flex flex-col gap-3">
      <p role="alert" className="text-danger text-sm font-medium">
        {t(failureMessageKey(reason))}
      </p>
      {action}
    </div>
  );
}
