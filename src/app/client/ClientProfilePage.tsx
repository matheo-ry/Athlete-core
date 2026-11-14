import { useTranslation } from 'react-i18next';

import { AccountSection } from '../AccountSection';
import { MySpacesSection } from '../MySpacesSection';

/**
 * El perfil del cliente (D-056 y D-058): sus espacios, su cuenta y la nota de
 * la plataforma. Se ve con la marca de su coach.
 */
export function ClientProfilePage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.clientProfile.title')}</h1>
      </header>
      <MySpacesSection />
      <AccountSection />
      <p className="text-muted text-center text-xs">{t('app.account.poweredBy')}</p>
    </section>
  );
}
