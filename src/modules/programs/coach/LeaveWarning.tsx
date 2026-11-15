import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/core/ui';

interface LeaveWarningProps {
  onStay: () => void;
  onLeave: () => void;
}

/**
 * "Tienes cambios sin guardar": al intentar ir a otra pantalla de la app desde
 * el editor (PR 2.8b). Fijo abajo, para que se vea aunque se haya bajado.
 */
export function LeaveWarning({ onStay, onLeave }: LeaveWarningProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);

  // El foco va a "Quedarme", el primer botón: es lo que no pierde nada.
  useEffect(() => {
    dialog.current?.querySelector('button')?.focus();
  }, []);

  return (
    <div
      ref={dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      className="bg-surface border-border fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-lg flex-col gap-2 rounded-lg border p-4 shadow-lg lg:bottom-8"
    >
      <p id={titleId} className="font-semibold">
        {t('programs.editor.leaveTitle')}
      </p>
      <p className="text-sm">{t('programs.editor.leaveDescription')}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onStay}>{t('programs.editor.stay')}</Button>
        <Button variant="ghost" onClick={onLeave}>
          {t('programs.editor.leave')}
        </Button>
      </div>
    </div>
  );
}
