import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDayLabel } from '@/core/lib';
import { HomeCardContent, collectHomeCards } from '@/core/modules';
import { PageHeader } from '@/core/ui';

import { useActiveModules } from '../useActiveModules';
import { FirstStepsCard } from './FirstStepsCard';

function riseDelay(index: number): CSSProperties {
  return { '--rise-delay': `${(index + 1) * 70}ms` } as CSSProperties;
}

/**
 * Inicio del coach (su negocio ya está en la cabecera): al empezar los primeros pasos (D-049) y las
 * tarjetas que aportan los módulos activos, como los avisos de rutinas (PR 2.18).
 */
export function CoachHomePage() {
  const { t, i18n } = useTranslation();
  const cards = collectHomeCards(useActiveModules(), 'coach');

  return (
    <section className="flex max-w-3xl flex-col gap-5">
      <PageHeader
        eyebrow={formatDayLabel(new Date(), i18n.language)}
        title={t('app.coachHome.title')}
        description={t('app.coachHome.description')}
      />
      <FirstStepsCard />
      {cards.map((card, index) => (
        <div key={card.key} className="animate-rise" style={riseDelay(index + 1)}>
          <HomeCardContent card={card} />
        </div>
      ))}
    </section>
  );
}
