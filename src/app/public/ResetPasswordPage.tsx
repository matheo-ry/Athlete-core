import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { readNextPath, useAuthAction } from '@/core/auth';

import { readEmailState } from './auth-navigation';
import { CodeStep } from './CodeStep';
import { EmailStep } from './EmailStep';
import { NewPasswordStep } from './NewPasswordStep';

type Step = { name: 'email' } | { name: 'code'; email: string } | { name: 'password' };

/**
 * "He olvidado mi contraseña" (D-042): email, código de 6 dígitos y contraseña
 * nueva. Al confirmar el código el usuario ya ha entrado (ha demostrado que el
 * email es suyo); al guardar la contraseña nueva se cierran sus sesiones en los
 * demás dispositivos y se va al inicio.
 *
 * No va detrás de `RequireGuest`: en el último paso ya hay sesión, y la
 * pantalla tiene que seguir hasta guardar la contraseña.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>({ name: 'email' });
  const sendCode = useAuthAction<string>((service, value) => service.sendPasswordResetCode(value));
  const verifyCode = useAuthAction<{ email: string; code: string }>((service, input) =>
    service.verifyPasswordResetCode(input.email, input.code),
  );
  const savePassword = useAuthAction<string>((service, password) =>
    service.updatePassword(password),
  );

  if (step.name === 'email') {
    return (
      <EmailStep
        title={t('app.resetPassword.title')}
        description={t('app.resetPassword.description')}
        initialEmail={readEmailState(location.state)}
        send={(value) => sendCode.mutateAsync(value)}
        onSent={(email) => setStep({ name: 'code', email })}
        isSending={sendCode.isPending}
        backTo={`/login${location.search}`}
      />
    );
  }

  if (step.name === 'code') {
    const { email } = step;
    return (
      <CodeStep
        email={email}
        verify={(code) => verifyCode.mutateAsync({ email, code })}
        onVerified={() => setStep({ name: 'password' })}
        isVerifying={verifyCode.isPending}
        resend={() => sendCode.mutateAsync(email)}
        onChangeEmail={() => setStep({ name: 'email' })}
      />
    );
  }

  return (
    <NewPasswordStep
      save={(password) => savePassword.mutateAsync(password)}
      onSaved={() => void navigate(readNextPath(location.search) ?? '/', { replace: true })}
      isSaving={savePassword.isPending}
    />
  );
}
