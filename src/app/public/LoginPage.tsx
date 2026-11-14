import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { checkEmail, useAuth, useSignIn } from '@/core/auth';
import type { AuthFailureReason } from '@/core/auth';
import { Button, Input, PasswordInput, buttonClassName } from '@/core/ui';

import { readEmailState } from './auth-navigation';
import { FailureMessage } from './FailureMessage';

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Entrar con email y contraseña (DECISIONES D-041, D-043 y D-061). Si algo
 * falla, la pantalla no cambia sola ni borra lo escrito: dice qué ha pasado.
 * Cuando hay sesión, `RequireGuest` lleva a la pantalla que se había pedido.
 */
export function LoginPage() {
  const { t } = useTranslation();
  const { signedOutReason } = useAuth();
  const signIn = useSignIn();
  const location = useLocation();
  const [email, setEmail] = useState(() => readEmailState(location.state));
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<AuthFailureReason | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);

    const checkedEmail = checkEmail(email);
    const errors: FieldErrors = {};
    if (!checkedEmail.ok) {
      errors.email =
        checkedEmail.error === 'required'
          ? t('core.auth.errors.emailRequired')
          : t('core.auth.errors.emailInvalid');
    }
    if (password === '') {
      errors.password = t('core.auth.errors.passwordRequired');
    }
    setFieldErrors(errors);
    if (!checkedEmail.ok || errors.password !== undefined) {
      return;
    }

    signIn.mutate(
      { email: checkedEmail.email, password },
      {
        onSuccess: (result) => setFailure(result.ok ? null : result.reason),
        onError: () => setFailure('unknown'),
      },
    );
  };

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t('app.login.title')}</h1>
        <p className="text-muted">{t('app.login.description')}</p>
      </header>

      {signedOutReason === 'expired' ? (
        <p role="status" className="bg-surface border-border rounded-lg border p-3 text-sm">
          {t('app.login.sessionExpired')}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('app.login.emailLabel')}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <PasswordInput
          label={t('app.login.passwordLabel')}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <FailureMessage
          reason={failure}
          action={
            failure === 'wrong_password' ? (
              <Link
                to={`/reset-password${location.search}`}
                state={{ email }}
                className={buttonClassName('primary')}
              >
                {t('app.login.forgotPassword')}
              </Link>
            ) : undefined
          }
        />
        <Button
          type="submit"
          variant={failure === 'wrong_password' ? 'secondary' : 'primary'}
          disabled={signIn.isPending}
        >
          {signIn.isPending ? t('app.login.submitting') : t('app.login.submit')}
        </Button>
      </form>
      <nav className="flex flex-col gap-1">
        <Link
          to={`/reset-password${location.search}`}
          state={{ email }}
          className={buttonClassName('ghost')}
        >
          {t('app.login.forgotPassword')}
        </Link>
        <Link
          to={`/login/code${location.search}`}
          state={{ email }}
          className={buttonClassName('ghost')}
        >
          {t('app.login.codeSignIn')}
        </Link>
      </nav>
    </>
  );
}
