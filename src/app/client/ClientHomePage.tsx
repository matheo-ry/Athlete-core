import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDayLabel } from '@/core/lib';
import { HomeCardContent, collectHomeCards } from '@/core/modules';
import { PageHeader } from '@/core/ui';

import { useActiveModules } from '../useActiveModules';

/** Retraso de entrada de cada bloque: la pantalla se va "montando" de arriba abajo. */
function riseDelay(index: number): CSSProperties {
  return { '--rise-delay': `${(index + 1) * 70}ms` } as CSSProperties;
}

/**
 * Inicio del cliente: la fecha de hoy, las tarjetas que aportan los
 * módulos activos, como "Hoy toca" (PR 2.18). El coach ya está en la cabecera.
 */
export function ClientHomePage() {
  const { t, i18n } = useTranslation();
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
    </section>
  );
}
