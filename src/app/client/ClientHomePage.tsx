import { useTranslation } from 'react-i18next';

import { HomeCardContent, collectHomeCards } from '@/core/modules';
import { useTenancy } from '@/core/tenancy';
import { Card } from '@/core/ui';

import { useActiveModules } from '../useActiveModules';

/**
 * Inicio del cliente: su coach y las tarjetas que aportan los módulos activos,
 * como "Hoy toca" (PR 2.18).
 */
export function ClientHomePage() {
  const { t } = useTranslation();
  const { tenant } = useTenancy();
  const cards = collectHomeCards(useActiveModules(), 'client');

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.clientHome.title')}</h1>
        <p className="text-muted">{t('app.clientHome.description')}</p>
      </header>
      {tenant ? (
        <Card>
          <p className="text-muted text-sm">{t('app.clientHome.coachLabel')}</p>
          <p className="text-lg font-semibold">{tenant.name}</p>
        </Card>
      ) : null}
      {cards.map((card) => (
        <HomeCardContent key={card.key} card={card} />
      ))}
    </section>
  );
}
