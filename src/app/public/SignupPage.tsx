import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

import { rememberPendingSignup, useAuthAction } from '@/core/auth';
import type { SignupInput } from '@/core/auth';
import { Button, Checkbox, Input, PasswordInput, buttonClassName } from '@/core/ui';

import { readEmailState } from './auth-navigation';
import { FailureMessage } from './FailureMessage';
import { useSignupForm } from './useSignupForm';

const legalLinkClass = 'text-primary-readable font-medium underline';

/**
 * Crear una cuenta (D-040, D-041 y D-060). Si el email ya tiene cuenta, lo dice
 * y resalta la salida que toca, sin cambiar de pantalla solo (D-043).
 */
export function SignupPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const verifyPath = `/verify${location.search}`;

  const goToVerify = (input: SignupInput) => {
    rememberPendingSignup({
      email: input.email,
      password: input.password,
      profile: {
        displayName: input.displayName,
        locale: input.locale,
        weightUnit: input.weightUnit,
        termsVersion: input.termsVersion,
      },
    });
    void navigate(verifyPath);
  };

  const form = useSignupForm(readEmailState(location.state), goToVerify);
  const resend = useAuthAction<string>((service, email) => service.resendSignupCode(email));

  // Cuenta pendiente de confirmar: se manda otro código y, al confirmar, vale la
  // contraseña que se acaba de escribir (D-043).
  const confirmPendingAccount = () => {
    const input = form.currentInput();
    if (input === null) {
      return;
    }
    void resend.mutateAsync(input.email).then((result) => {
      // Si se mandó un código hace menos de 60 segundos, ese sigue valiendo.
      if (result.ok || result.reason === 'rate_limited') {
        goToVerify(input);
      } else {
        form.setFailure(result.reason);
      }
    });
  };

  const failureAction =
    form.failure === 'account_exists' ? (
      <div className="flex flex-col gap-2">
        <Link
          to={`/reset-password${location.search}`}
          state={{ email: form.fields.email }}
          className={buttonClassName('primary', undefined, 'lg')}
        >
          {t('app.login.forgotPassword')}
        </Link>
        <Link
          to={`/login${location.search}`}
          state={{ email: form.fields.email }}
          className={buttonClassName('secondary')}
        >
          {t('app.signup.signIn')}
        </Link>
      </div>
    ) : form.failure === 'email_not_confirmed' ? (
      <Button onClick={confirmPendingAccount} disabled={resend.isPending}>
        {t('app.login.confirmEmail')}
      </Button>
    ) : undefined;

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-[1.08] font-semibold md:text-4xl">
          {t('app.signup.title')}
        </h1>
        <p className="text-muted">{t('app.signup.description')}</p>
      </header>
      <form onSubmit={form.handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label={t('app.signup.nameLabel')}
          name="name"
          autoComplete="name"
          value={form.fields.name}
          onChange={(event) => form.setName(event.target.value)}
          error={form.fieldErrors.name}
        />
        <Input
          label={t('app.signup.emailLabel')}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.fields.email}
          onChange={(event) => form.setEmail(event.target.value)}
          error={form.fieldErrors.email}
        />
        <PasswordInput
          label={t('app.signup.passwordLabel')}
          hint={t('app.signup.passwordHint')}
          name="new-password"
          autoComplete="new-password"
          value={form.fields.password}
          onChange={(event) => form.setPassword(event.target.value)}
          error={form.fieldErrors.password}
        />
        <Checkbox
          name="terms"
          checked={form.fields.acceptedTerms}
          onChange={(event) => form.setAcceptedTerms(event.target.checked)}
          error={form.fieldErrors.terms}
          label={
            <Trans
              i18nKey="app.signup.terms"
              components={{
                // Se abren aparte para no perder lo escrito en el formulario.
                terms: (
                  <a
                    href="/legal/terms"
                    target="_blank"
                    rel="noopener"
                    className={legalLinkClass}
                  />
                ),
                privacy: (
                  <a
                    href="/legal/privacy"
                    target="_blank"
                    rel="noopener"
                    className={legalLinkClass}
                  />
                ),
              }}
            />
          }
        />
        <FailureMessage reason={form.failure} action={failureAction} />
        <Button
          type="submit"
          size="lg"
          variant={form.failure === null ? 'primary' : 'secondary'}
          disabled={form.isSubmitting}
        >
          {form.isSubmitting ? t('app.signup.submitting') : t('app.signup.submit')}
        </Button>
      </form>
      <Link
        to={`/login${location.search}`}
        state={{ email: form.fields.email }}
        className={buttonClassName('ghost')}
      >
        {t('app.signup.haveAccount')}
      </Link>
    </>
  );
}
