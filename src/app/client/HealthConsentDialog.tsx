import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useHealthConsentPrompt } from '@/core/tenancy';
import { Button } from '@/core/ui';

/**
 * La ventana del consentimiento de datos de salud (D-126): "Acepto" y "Ahora
 * no". Sale sola la primera vez que el cliente entra en el espacio de su coach
 * y, tras un "Ahora no", cuando va a apuntar peso, medidas o notas. Con el
 * permiso dado no se ve. El texto es un borrador hasta que lo revise un
 * abogado (D-126, Fase 4).
 */
export function HealthConsentDialog() {
  const { dialog } = useHealthConsentPrompt();
  return dialog.isOpen ? <OpenDialog /> : null;
}

function OpenDialog() {
  const { t } = useTranslation();
  const { dialog } = useHealthConsentPrompt();
  const titleId = useId();
  const bodyId = useId();
  const panel = useRef<HTMLDivElement>(null);

  // El foco entra en la ventana, en "Ahora no": un Enter sin querer no da un permiso de salud.
  useEffect(() => {
    panel.current?.querySelector('button')?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      dialog.decline();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    // El foco no sale de la ventana mientras está abierta.
    const buttons = [...(panel.current?.querySelectorAll('button') ?? [])].filter(
      (button) => !button.disabled,
    );
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (first === undefined || last === undefined) {
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    // En el móvil sale desde abajo, por encima de la barra de gestos; en escritorio, centrada.
    <div className="bg-background/80 fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm md:items-center md:p-6">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={onKeyDown}
        className="animate-rise surface-raised flex w-full max-w-md flex-col gap-4 rounded-t-3xl p-6 pb-[calc(1.5rem+var(--safe-bottom))] md:rounded-3xl md:pb-6"
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {t('app.healthConsent.title')}
        </h2>
        <p id={bodyId} className="text-muted text-sm leading-relaxed">
          {t('app.healthConsent.body')}
        </p>
        {dialog.failure === null ? null : (
          <p role="alert" className="text-danger text-sm font-medium">
            {t(dialog.failure === 'offline' ? 'core.errors.offline' : 'core.errors.unexpected')}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={dialog.decline} disabled={dialog.isPending}>
            {t('app.healthConsent.notNow')}
          </Button>
          <Button onClick={dialog.accept} disabled={dialog.isPending}>
            {t('app.healthConsent.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
