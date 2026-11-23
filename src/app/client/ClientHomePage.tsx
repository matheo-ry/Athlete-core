import { useTranslation } from 'react-i18next';

import { useBrand } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import { HomeCardContent, collectHomeCards } from '@/core/modules';
import { useTenancy } from '@/core/tenancy';
import { Card, HeroBackdrop, PageHeader, enterDelay, photoFor } from '@/core/ui';

import { BrandBadge } from '../BrandBadge';
import { useActiveModules } from '../useActiveModules';

/**
 * Inicio del cliente (D-prime1-7): una foto a toda la pantalla, "Hoy" en grande
 * y, encima de la foto, las tarjetas que aportan los módulos activos, como
 * "Hoy toca" (PR 2.18). Su coach, al final. La foto cambia con el día de la
 * semana para que la app no se vea siempre igual.
 */
export function ClientHomePage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const brand = useBrand();
  const { tenant } = useTenancy();
  const cards = collectHomeCards(useActiveModules(), 'client');
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  return (
    <>
      <HeroBackdrop photo={photoFor(now.getDay())} />
      <section className="over-photo flex flex-col gap-4 pt-[16svh]">
        <PageHeader onPhoto eyebrow={dateLabel} title={t('app.clientHome.title')} />
        <div className="mt-4 flex flex-col gap-4">
          {cards.map((card) => (
            <HomeCardContent key={card.key} card={card} />
          ))}
        </div>
        {tenant ? (
          <Card className="animate-enter flex items-center gap-4 p-4" style={enterDelay(160)}>
            <BrandBadge brand={brand} size="sm" round />
            <div className="min-w-0">
              <p className="eyebrow text-muted">{t('app.clientHome.coachLabel')}</p>
              <p className="truncate text-base font-semibold">{tenant.name}</p>
            </div>
          </Card>
        ) : null}
      </section>
    </>
  );
}
