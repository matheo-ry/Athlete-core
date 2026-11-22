import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { isCompleteCode, normalizeCode, useResendTimer } from '@/core/auth';
import type { AuthFailureReason, AuthResult } from '@/core/auth';
import { Button, Input } from '@/core/ui';

import { FailureMessage } from './FailureMessage';

interface CodeStepProps {
  email: string;
  /** Comprueba el código. Si va bien, la pantalla que lo usa decide qué sigue. */
  verify: (code: string) => Promise<AuthResult>;
  onVerified: () => void;
  isVerifying: boolean;
  resend: () => Promise<AuthResult>;
  onChangeEmail: () => void;
}

/**
 * Escribir el código de 6 dígitos que llega por email (D-038 y D-039). Se puede
 * pegar entero, abre el teclado numérico en el móvil y deja pedir otro pasados
 * 60 segundos. Lo usan entrar con código, recuperar la contraseña y confirmar
 * el email.
 */
export function CodeStep({
  email,
  verify,
  onVerified,
  isVerifying,
  resend,
  onChangeEmail,
}: CodeStepProps) {
  const { t } = useTranslation();
  const { secondsLeft, restart } = useResendTimer();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();
  const [failure, setFailure] = useState<AuthFailureReason | null>(null);
  const [resent, setResent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setResent(false);
    if (!isCompleteCode(code)) {
      setCodeError(t('core.auth.errors.codeRequired'));
      return;
    }
    setCodeError(undefined);
    void verify(normalizeCode(code)).then((result) => {
      if (result.ok) {
        onVerified();
      } else {
        setFailure(result.reason);
      }
    });
  };

  const handleResend = () => {
    setFailure(null);
    setResent(false);
    restart();
    void resend().then((result) => {
      if (result.ok) {
        setResent(true);
        setCode('');
      } else {
        setFailure(result.reason);
      }
    });
  };

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-[1.08] font-semibold md:text-4xl">
          {t('app.codeStep.title')}
        </h1>
        <p className="text-muted">{t('app.codeStep.sentTo', { email })}</p>
      </header>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('app.codeStep.label')}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="numeric min-h-16 text-center text-3xl tracking-[0.5em]"
          value={code}
          onChange={(event) => setCode(normalizeCode(event.target.value))}
          error={codeError}
        />
        <FailureMessage reason={failure} />
        {resent ? (
          <p role="status" className="text-muted text-sm">
            {t('app.codeStep.resent')}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={isVerifying}>
          {isVerifying ? t('app.codeStep.verifying') : t('app.codeStep.submit')}
        </Button>
      </form>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={handleResend} disabled={secondsLeft > 0}>
          {secondsLeft > 0
            ? t('app.codeStep.resendIn', { seconds: secondsLeft })
            : t('app.codeStep.resend')}
        </Button>
        <Button variant="ghost" onClick={onChangeEmail}>
          {t('app.codeStep.changeEmail')}
        </Button>
      </div>
    </>
  );
}
