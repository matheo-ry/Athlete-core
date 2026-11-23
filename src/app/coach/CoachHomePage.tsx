import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { HomeCardContent, collectHomeCards } from '@/core/modules';
import { countActiveClients, useTenancy, useTenantMembers } from '@/core/tenancy';
import { HeroBackdrop, PageHeader, enterDelay } from '@/core/ui';

import { useActiveModules } from '../useActiveModules';
import { FirstStepsCard } from './FirstStepsCard';

/**
 * Inicio del coach (D-prime1-7): la foto de cabecera con su negocio y el titular,
 * la cifra de clientes activos y, debajo, los primeros pasos (D-049) y las
 * tarjetas de los módulos activos (avisos, actividad), en dos columnas en
 * escritorio.
 */
export function CoachHomePage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const { tenant } = useTenancy();
  const members = useTenantMembers();
  const cards = collectHomeCards(useActiveModules(), 'coach');
  const dateLabel = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const activeClients = members.data === undefined ? null : countActiveClients(members.data);

  return (
    <>
      <HeroBackdrop photo="dumbbells" size="short" />
      <section className="flex flex-col gap-8 pt-[12svh] md:pt-24">
        <PageHeader
          onPhoto
          eyebrow={tenant ? `${tenant.name} · ${dateLabel}` : dateLabel}
          title={t('app.coachHome.title')}
          description={t('app.coachHome.description')}
          actions={
            activeClients === null ? null : (
              <p className="glass-photo flex items-baseline gap-3 rounded-3xl px-5 py-4">
                <span className="numeral text-5xl">{activeClients}</span>
                <span className="text-on-photo-muted max-w-28 text-sm leading-tight">
                  {t('app.coachHome.activeClients', { count: activeClients })}
                </span>
              </p>
            )
          }
        />
        <div
          className="animate-enter over-photo grid items-start gap-4 lg:grid-cols-2"
          style={enterDelay(120)}
        >
          <FirstStepsCard />
          {cards.map((card) => (
            <HomeCardContent key={card.key} card={card} />
          ))}
        </div>
      </section>
    </>
  );
}
