import { useTranslation } from 'react-i18next';

import { useTenancy } from '@/core/tenancy';

import { AccountSection } from '../AccountSection';
import { MySpacesSection } from '../MySpacesSection';
import { BrandSection } from './BrandSection';

/**
 * Ajustes del coach: "Marca" (solo el dueño, PR 1.15 y 1.16, con el logo),
 * "Mis espacios" (PR 1.14) y "Mi cuenta" (PR 1.13).
 */
export function CoachSettingsPage() {
  const { t } = useTranslation();
  const { tenant, role } = useTenancy();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.coachSettings.title')}</h1>
      </header>
      {/* `key`: al cambiar de negocio, el formulario empieza con su marca. */}
      {tenant !== null && role === 'owner' ? (
        <BrandSection key={tenant.id} tenant={tenant} />
      ) : null}
      <MySpacesSection />
      <AccountSection />
    </section>
  );
}
