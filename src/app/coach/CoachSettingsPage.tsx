import { useTranslation } from 'react-i18next';

import { useTenancy } from '@/core/tenancy';

import { AccountSection } from '../AccountSection';
import { MySpacesSection } from '../MySpacesSection';
import { BrandSection } from './BrandSection';
import { TrainingSection } from './TrainingSection';

/**
 * Ajustes del coach: "Marca" (solo el dueño, PR 1.15 y 1.16, con el logo),
 * "Entrenamiento" (solo el dueño, PR 2.10b: RIR o RPE),
 * "Mis espacios" (PR 1.14) y "Mi cuenta" (PR 1.13).
 */
export function CoachSettingsPage() {
  const { t } = useTranslation();
  const { tenant, role } = useTenancy();

  return (
    <section className="flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="text-3xl leading-[1.08] font-semibold md:text-4xl">
          {t('app.coachSettings.title')}
        </h1>
      </header>
      {/* `key`: al cambiar de negocio, el formulario empieza con su marca. */}
      {tenant !== null && role === 'owner' ? (
        <BrandSection key={tenant.id} tenant={tenant} />
      ) : null}
      {tenant !== null && role === 'owner' ? <TrainingSection key={tenant.id} /> : null}
      <MySpacesSection />
      <AccountSection />
    </section>
  );
}
