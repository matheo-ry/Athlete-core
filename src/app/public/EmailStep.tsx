import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { checkEmail } from '@/core/auth';
import type { AuthFailureReason, AuthResult } from '@/core/auth';
import { Button, Input, buttonClassName } from '@/core/ui';

import { FailureMessage } from './FailureMessage';

interface EmailStepProps {
  title: string;
  description: string;
  initialEmail: string;
  /** Manda el código. Si va bien, `onSent` pasa al paso siguiente. */
  send: (email: string) => Promise<AuthResult>;
  onSent: (email: string) => void;
  isSending: boolean;
  /** Adónde lleva "Volver a entrar". */
  backTo: string;
}

/** Primer paso de un código por email: escribir el email y mandarlo. */
export function EmailStep({
  title,
  description,
  initialEmail,
  send,
  onSent,
  isSending,
  backTo,
}: EmailStepProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [failure, setFailure] = useState<AuthFailureReason | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    const checked = checkEmail(email);
    if (!checked.ok) {
      setEmailError(
        checked.error === 'required'
          ? t('core.auth.errors.emailRequired')
          : t('core.auth.errors.emailInvalid'),
      );
      return;
    }
    setEmailError(undefined);
    void send(checked.email).then((result) => {
      if (result.ok) {
        onSent(checked.email);
      } else {
        setFailure(result.reason);
      }
    });
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted">{description}</p>
      </header>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('app.emailStep.emailLabel')}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />
        <FailureMessage reason={failure} />
        <Button type="submit" disabled={isSending}>
          {isSending ? t('app.emailStep.sending') : t('app.emailStep.submit')}
        </Button>
      </form>
      <Link to={backTo} state={{ email }} className={buttonClassName('ghost')}>
        {t('app.emailStep.back')}
      </Link>
    </>
  );
}
