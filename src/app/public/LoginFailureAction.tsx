import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

import { checkEmail, rememberPendingSignup, useAuthAction } from '@/core/auth';
import type { AuthFailureReason } from '@/core/auth';
import { Button, buttonClassName } from '@/core/ui';

import { CreateAccountLink } from './CreateAccountLink';

interface LoginFailureActionProps {
  reason: AuthFailureReason | null;
  email: string;
  password: string;
}

/**
 * La salida resaltada de cada fallo al entrar (D-043). La pantalla nunca cambia
 * sola: el usuario elige.
 * - Contraseña mala: "He olvidado mi contraseña".
 * - Sin cuenta: "Crear cuenta".
 * - Cuenta sin confirmar: "Confirmar mi email", que manda un código nuevo
 *   (D-038). La contraseña escrita es la buena: Supabase solo dice "sin
 *   confirmar" cuando la contraseña es correcta.
 */
export function LoginFailureAction({ reason, email, password }: LoginFailureActionProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const resend = useAuthAction<string>((service, value) => service.resendSignupCode(value));

  if (reason === 'wrong_password') {
    return (
      <Link
        to={`/reset-password${location.search}`}
        state={{ email }}
        className={buttonClassName('primary')}
      >
        {t('app.login.forgotPassword')}
      </Link>
    );
  }
  if (reason === 'no_account') {
    return <CreateAccountLink email={email} />;
  }
  if (reason !== 'email_not_confirmed') {
    return null;
  }

  const confirm = () => {
    const checked = checkEmail(email);
    if (!checked.ok) {
      return;
    }
    void resend.mutateAsync(checked.email).then((result) => {
      if (result.ok || result.reason === 'rate_limited') {
        rememberPendingSignup({ email: checked.email, password, profile: null });
        void navigate(`/verify${location.search}`);
      }
    });
  };

  return (
    <Button onClick={confirm} disabled={resend.isPending}>
      {t('app.login.confirmEmail')}
    </Button>
  );
}
