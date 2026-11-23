import { useTranslation } from 'react-i18next';

import { useProfile } from '@/core/auth';
import { Avatar, PageHeader } from '@/core/ui';

import { AccountSection } from '../AccountSection';
import { MySpacesSection } from '../MySpacesSection';
import { TrainingSettingsSection } from '../TrainingSettingsSection';

/**
 * El perfil del cliente (D-056 y D-058): sus espacios, sus ajustes de entreno, su cuenta y la nota de
 * la plataforma. Se ve con la marca de su coach.
 */
export function ClientProfilePage() {
  const { t } = useTranslation();
  const name = useProfile().data?.displayName ?? '';

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t('app.clientProfile.title')} />
      {name === '' ? null : (
        <div className="animate-enter flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <p className="display text-2xl break-words">{name}</p>
        </div>
      )}
      <MySpacesSection />
      <TrainingSettingsSection />
      <AccountSection />
      <p className="eyebrow text-muted mt-4 text-center">{t('app.account.poweredBy')}</p>
    </section>
  );
}
