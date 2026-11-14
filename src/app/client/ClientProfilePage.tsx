import { useTranslation } from 'react-i18next';

import { AccountSection } from '../AccountSection';

/** El perfil del cliente (D-058), con la marca de su coach y la nota de la plataforma. */
export function ClientProfilePage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.clientProfile.title')}</h1>
      </header>
      <AccountSection />
      <p className="text-muted text-center text-xs">{t('app.account.poweredBy')}</p>
    </section>
  );
}
