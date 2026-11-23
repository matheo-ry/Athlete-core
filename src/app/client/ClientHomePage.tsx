import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { useBrand } from '@/core/branding';
import { formatDayLabel } from '@/core/lib';
import { HomeCardContent, collectHomeCards } from '@/core/modules';
import { useTenancy } from '@/core/tenancy';
import { Card, PageHeader } from '@/core/ui';

import { BrandBadge } from '../BrandBadge';
import { useActiveModules } from '../useActiveModules';

/** Retraso de entrada de cada bloque: la pantalla se va "montando" de arriba abajo. */
function riseDelay(index: number): CSSProperties {
  return { '--rise-delay': `${(index + 1) * 70}ms` } as CSSProperties;
}

/**
 * Inicio del cliente: la fecha de hoy, primero las tarjetas que aportan los
 * módulos activos, como "Hoy toca" (PR 2.18), y al final su coach.
 */
export function ClientHomePage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useTenancy();
  const brand = useBrand();
  const cards = collectHomeCards(useActiveModules(), 'client');

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        eyebrow={formatDayLabel(new Date(), i18n.language)}
        title={t('app.clientHome.title')}
        description={t('app.clientHome.description')}
      />
      {cards.map((card, index) => (
        <div key={card.key} className="animate-rise" style={riseDelay(index)}>
          <HomeCardContent card={card} />
        </div>
      ))}
      {tenant ? (
        <Card
          tone="raised"
          className="animate-rise flex items-center gap-4"
          style={riseDelay(cards.length + 1)}
        >
          <BrandBadge brand={brand} />
          <div className="min-w-0">
            <p className="eyebrow">{t('app.clientHome.coachLabel')}</p>
            <p className="truncate text-lg font-semibold">{tenant.name}</p>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
