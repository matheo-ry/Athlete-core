import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import {
  clearPendingSignup,
  readNextPath,
  readPendingSignup,
  rememberPendingSignup,
  useAuthAction,
} from '@/core/auth';
import type { PendingSignup, SignupProfile } from '@/core/auth';

import { CodeStep } from './CodeStep';
import { CreateAccountLink } from './CreateAccountLink';
import { EmailStep } from './EmailStep';
import { FinishSignupStep } from './FinishSignupStep';
import { NewPasswordStep } from './NewPasswordStep';

type Step = 'email' | 'code' | 'password' | 'finish';

/**
 * Confirmar el email con el código de 6 dígitos (D-038). Justo después se vuelve
 * a guardar la contraseña recién escrita y los datos del formulario: así vale
 * siempre la última, aunque otra persona hubiera registrado antes este email
 * (D-043). Si ya no se sabe la contraseña (se cerró la app), se pide elegir una.
 *
 * No va detrás de `RequireGuest`: al confirmar el código ya hay sesión, y la
 * pantalla tiene que terminar el registro.
 */
export function VerifyEmailPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingSignup | null>(() => readPendingSignup());
  const [step, setStep] = useState<Step>(() => (pending === null ? 'email' : 'code'));

  const resend = useAuthAction<string>((service, email) => service.resendSignupCode(email));
  const verify = useAuthAction<{ email: string; code: string }>((service, input) =>
    service.verifySignupCode(input.email, input.code),
  );
  const {
    mutateAsync: completeSignup,
    isPending: isCompleting,
    data: completeResult,
  } = useAuthAction<{ password: string | null; profile: SignupProfile | null }>((service, input) =>
    service.completeSignup(input),
  );

  const done = useCallback(() => {
    clearPendingSignup();
    void navigate(readNextPath(location.search) ?? '/', { replace: true });
  }, [navigate, location.search]);

  const finish = useCallback(
    () =>
      completeSignup({ password: pending?.password ?? null, profile: pending?.profile ?? null }),
    [completeSignup, pending],
  );

  if (step === 'email' || pending === null) {
    return (
      <EmailStep
        title={t('app.verify.title')}
        description={t('app.verify.description')}
        initialEmail={pending?.email ?? ''}
        send={(email) => resend.mutateAsync(email)}
        onSent={(email) => {
          const next = { email, password: null, profile: null };
          rememberPendingSignup(next);
          setPending(next);
          setStep('code');
        }}
        isSending={resend.isPending}
        backTo={`/login${location.search}`}
        failureAction={(reason, email) =>
          reason === 'no_account' ? <CreateAccountLink email={email} /> : null
        }
      />
    );
  }

  if (step === 'code') {
    const { email } = pending;
    return (
      <CodeStep
        email={email}
        verify={(code) => verify.mutateAsync({ email, code })}
        onVerified={() => setStep(pending.password === null ? 'password' : 'finish')}
        isVerifying={verify.isPending}
        resend={() => resend.mutateAsync(email)}
        onChangeEmail={() => setStep('email')}
      />
    );
  }

  if (step === 'password') {
    return (
      <NewPasswordStep
        title={t('app.verify.passwordTitle')}
        description={t('app.verify.passwordDescription')}
        save={(password) => completeSignup({ password, profile: pending.profile })}
        onSaved={done}
        isSaving={isCompleting}
      />
    );
  }

  return (
    <FinishSignupStep
      finish={finish}
      onFinished={done}
      result={completeResult}
      isFinishing={isCompleting}
    />
  );
}
