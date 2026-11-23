import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAuth, useProfile } from '@/core/auth';
import { LanguageSwitcher } from '@/core/i18n';
import { Card, ErrorState, Spinner } from '@/core/ui';

import { ChangePasswordForm } from './ChangePasswordForm';
import { ProfileNameForm } from './ProfileNameForm';
import { SignOutButton } from './SignOutButton';
import { WeightUnitChoice } from './WeightUnitChoice';

/**
 * "Mi cuenta" (D-058): nombre, idioma, unidad de peso, el email (solo se ve),
 * cambiar la contraseña, los textos legales y cerrar sesión. La usan el perfil
 * del cliente y los ajustes del coach.
 */
export function AccountSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const profile = useProfile();

  return (
    <Card>
      <div className="flex flex-col gap-5">
        <h2 className="display text-[1.6rem]">{t('app.account.title')}</h2>

        {profile.isPending ? <Spinner /> : null}
        {profile.isError ? <ErrorState onRetry={() => void profile.refetch()} /> : null}
        {profile.data !== undefined ? (
          <>
            <ProfileNameForm initialName={profile.data.displayName} />
            <div className="flex flex-col gap-2">
              <span className="text-foreground/85 text-sm font-medium">
                {t('app.account.languageLabel')}
              </span>
              {/* Cambia la app al momento y se guarda en el perfil (ProfileLanguageSync). */}
              <LanguageSwitcher />
            </div>
            <WeightUnitChoice value={profile.data.weightUnit} />
          </>
        ) : null}

        <div className="bg-glass flex flex-col gap-1 rounded-2xl px-4 py-3 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
          <span className="eyebrow text-muted">{t('app.account.emailLabel')}</span>
          <span data-testid="account-email" className="font-medium break-all">
            {user?.email}
          </span>
          <span className="text-muted text-sm">{t('app.account.emailHint')}</span>
        </div>

        <ChangePasswordForm />

        <nav aria-label={t('app.account.legalTitle')} className="flex flex-wrap gap-4 text-sm">
          <Link
            to="/legal/terms"
            className="text-muted hover:text-foreground focus-ring rounded underline underline-offset-4"
          >
            {t('app.account.terms')}
          </Link>
          <Link
            to="/legal/privacy"
            className="text-muted hover:text-foreground focus-ring rounded underline underline-offset-4"
          >
            {t('app.account.privacy')}
          </Link>
        </nav>

        <SignOutButton />
      </div>
    </Card>
  );
}
