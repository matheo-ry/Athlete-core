import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/core/ui';

import { AccountSection } from '../AccountSection';
import { MySpacesSection } from '../MySpacesSection';
import { TrainingSettingsSection } from '../TrainingSettingsSection';
import { HealthDataSection } from './HealthDataSection';

/**
 * El perfil del cliente (D-056 y D-058): sus espacios, sus ajustes de entreno, sus datos de salud (D-126), su cuenta y la nota de
 * la plataforma. Se ve con la marca de su coach.
 */
export function ClientProfilePage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t('app.clientProfile.title')} />
      <MySpacesSection />
      <TrainingSettingsSection />
      <HealthDataSection />
      <AccountSection />
      <p className="text-muted text-center text-xs">{t('app.account.poweredBy')}</p>
    </section>
  );
}
