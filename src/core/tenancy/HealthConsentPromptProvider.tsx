import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '../auth';
import { shouldPromptOnEntry } from './health-consent';
import { markHealthConsentAsked, useHealthConsentAsked } from './health-consent-asked';
import { HealthConsentPromptContext } from './health-consent-prompt-context';
import type { HealthConsentPromptValue } from './health-consent-prompt-context';
import { useHealthConsent } from './useHealthConsent';
import { useTenancyContext } from './useTenancy';

interface ProviderProps {
  children: ReactNode;
}

/**
 * La ventana del consentimiento de datos de salud (D-126): sale sola la primera
 * vez que el cliente entra en el espacio de un coach (también a los clientes que
 * ya existían) y, tras un "Ahora no", cuando alguien pide `ensure()` porque va a
 * apuntar peso, medidas o notas. Solo da el estado; quien la monta la pinta.
 *
 * Se monta en la zona del cliente. Con otro espacio, empieza de cero.
 */
export function HealthConsentPromptProvider({ children }: ProviderProps) {
  const tenantId = useTenancyContext().tenancy.tenant?.id ?? null;
  return (
    <PromptForSpace key={tenantId ?? 'none'} tenantId={tenantId}>
      {children}
    </PromptForSpace>
  );
}

function PromptForSpace({ children, tenantId }: ProviderProps & { tenantId: string | null }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const consent = useHealthConsent();
  const asked = useHealthConsentAsked(userId, tenantId);
  const [requested, setRequested] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [failure, setFailure] = useState<'offline' | 'error' | null>(null);
  const waiting = useRef<((granted: boolean) => void)[]>([]);

  // Sale sola solo con el estado ya cargado: nunca por un fallo de red.
  const isOpen = requested || shouldPromptOnEntry(consent.state, asked);
  const { grant, isGranted } = consent;

  const settle = useCallback((granted: boolean) => {
    setRequested(false);
    setFailure(null);
    for (const resolve of waiting.current) {
      resolve(granted);
    }
    waiting.current = [];
  }, []);

  const ensure = useCallback((): Promise<boolean> => {
    if (isGranted) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      waiting.current.push(resolve);
      setRequested(true);
    });
  }, [isGranted]);

  const accept = useCallback(() => {
    setIsPending(true);
    setFailure(null);
    void grant()
      .then((result) => {
        if (result === 'ok') {
          settle(true);
        } else {
          setFailure(result);
        }
      })
      .catch(() => {
        setFailure('error');
      })
      .finally(() => {
        setIsPending(false);
      });
  }, [grant, settle]);

  const decline = useCallback(() => {
    if (userId !== null && tenantId !== null) {
      markHealthConsentAsked(userId, tenantId);
    }
    settle(false);
  }, [userId, tenantId, settle]);

  const value = useMemo<HealthConsentPromptValue>(
    () => ({ ensure, dialog: { isOpen, isPending, failure, accept, decline } }),
    [ensure, isOpen, isPending, failure, accept, decline],
  );

  return <HealthConsentPromptContext value={value}>{children}</HealthConsentPromptContext>;
}
