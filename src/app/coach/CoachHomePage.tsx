import { useTranslation } from 'react-i18next';

import { HomeCardContent, collectHomeCards } from '@/core/modules';
import { useTenancy } from '@/core/tenancy';
import { Card } from '@/core/ui';

import { useActiveModules } from '../useActiveModules';
import { FirstStepsCard } from './FirstStepsCard';

/**
 * Inicio del coach: su negocio, al empezar los primeros pasos (D-049) y las
 * tarjetas que aportan los módulos activos, como los avisos de rutinas (PR 2.18).
 */
export function CoachHomePage() {
  const { t } = useTranslation();
  const { tenant } = useTenancy();
  const cards = collectHomeCards(useActiveModules(), 'coach');

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.coachHome.title')}</h1>
        <p className="text-muted">{t('app.coachHome.description')}</p>
      </header>
      {tenant ? (
        <Card>
          <p className="text-muted text-sm">{t('app.coachHome.businessLabel')}</p>
          <p className="text-lg font-semibold">{tenant.name}</p>
        </Card>
      ) : null}
      <FirstStepsCard />
      {cards.map((card) => (
        <HomeCardContent key={card.key} card={card} />
      ))}
    </section>
  );
}
