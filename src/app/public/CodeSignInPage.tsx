import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { useAuthAction } from '@/core/auth';

import { readEmailState } from './auth-navigation';
import { CodeStep } from './CodeStep';
import { EmailStep } from './EmailStep';

/**
 * Entrar sin contraseña, con un código de 6 dígitos por email (D-039). Solo
 * para cuentas que ya existen. Al entrar, `RequireGuest` lleva a la pantalla
 * que se había pedido.
 */
export function CodeSignInPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [email, setEmail] = useState<string | null>(null);
  const sendCode = useAuthAction<string>((service, value) => service.sendSignInCode(value));
  const verifyCode = useAuthAction<{ email: string; code: string }>((service, input) =>
    service.verifySignInCode(input.email, input.code),
  );
  const loginPath = `/login${location.search}`;

  if (email === null) {
    return (
      <EmailStep
        title={t('app.codeSignIn.title')}
        description={t('app.codeSignIn.description')}
        initialEmail={readEmailState(location.state)}
        send={(value) => sendCode.mutateAsync(value)}
        onSent={setEmail}
        isSending={sendCode.isPending}
        backTo={loginPath}
      />
    );
  }

  return (
    <CodeStep
      email={email}
      verify={(code) => verifyCode.mutateAsync({ email, code })}
      // La sesión ya está abierta: RequireGuest se encarga de salir de aquí.
      onVerified={() => undefined}
      isVerifying={verifyCode.isPending}
      resend={() => sendCode.mutateAsync(email)}
      onChangeEmail={() => setEmail(null)}
    />
  );
}
