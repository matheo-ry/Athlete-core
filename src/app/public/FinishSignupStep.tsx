import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { AuthResult } from '@/core/auth';
import { Button, Spinner } from '@/core/ui';

import { FailureMessage } from './FailureMessage';

interface FinishSignupStepProps {
  finish: () => Promise<AuthResult>;
  onFinished: () => void;
  result: AuthResult | undefined;
  isFinishing: boolean;
}

/**
 * Último paso del registro, sin que el usuario haga nada: guardar otra vez la
 * contraseña y los datos (D-043). Si falla, deja reintentar.
 */
export function FinishSignupStep({
  finish,
  onFinished,
  result,
  isFinishing,
}: FinishSignupStepProps) {
  const { t } = useTranslation();
  const started = useRef(false);

  useEffect(() => {
    // Una sola vez, aunque React monte el componente dos veces en desarrollo.
    if (started.current) {
      return;
    }
    started.current = true;
    void finish().then((outcome) => {
      if (outcome.ok) {
        onFinished();
      }
    });
  }, [finish, onFinished]);

  if (result !== undefined && !result.ok && !isFinishing) {
    return (
      <>
        <FailureMessage reason={result.reason} />
        <Button
          onClick={() =>
            void finish().then((outcome) => {
              if (outcome.ok) {
                onFinished();
              }
            })
          }
        >
          {t('core.ui.retry')}
        </Button>
      </>
    );
  }
  return <Spinner label={t('app.verify.finishing')} />;
}
