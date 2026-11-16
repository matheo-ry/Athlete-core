import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/core/ui';

interface AssignDialogProps {
  title: string;
  onClose: () => void;
  /** El formulario de asignar (`AssignForm`). */
  children: ReactNode;
}

/**
 * "Asignar" una plantilla (PR 2.13). En el móvil ocupa la pantalla; en el
 * ordenador es una ventana centrada. Escape la cierra y, al cerrarse, el
 * foco vuelve al botón que la abrió.
 */
export function AssignDialog({ title, onClose, children }: AssignDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  // El foco, solo al abrir y al cerrar: si se moviera en cada render, saltaría al escribir.
  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => {
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    // En el móvil ocupa la pantalla entera: deja libres la barra de estado y la de gestos.
    <div className="bg-background/80 fixed inset-0 z-50 flex pt-[var(--safe-top)] pb-[var(--safe-bottom)] md:items-center md:justify-center md:p-6">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface border-border flex w-full flex-col gap-4 overflow-y-auto p-4 md:max-h-[90dvh] md:max-w-xl md:rounded-lg md:border md:p-6 md:shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold break-words">
            {title}
          </h2>
          <Button variant="ghost" aria-label={t('programs.assign.close')} onClick={onClose}>
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
