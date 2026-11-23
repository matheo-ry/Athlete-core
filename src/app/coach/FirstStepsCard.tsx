import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { countActiveClients, useTenancy, useTenantMembers } from '@/core/tenancy';
import { Card, ROW_LINK_CLASS, SECTION_TITLE_CLASS } from '@/core/ui';

const STEPS = [
  { to: '/coach/clients', title: 'shareCode', hint: 'shareCodeHint' },
  { to: '/coach/settings', title: 'brand', hint: 'brandHint' },
] as const;

/**
 * "Primeros pasos" en el inicio del coach (D-049): compartir el código y
 * personalizar la marca. Desaparece cuando tiene su primer cliente activo.
 */
export function FirstStepsCard() {
  const { t } = useTranslation();
  const { role } = useTenancy();
  const members = useTenantMembers();

  if (role !== 'owner' || members.data === undefined || countActiveClients(members.data) > 0) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-3 lg:col-span-2">
      <h2 className={SECTION_TITLE_CLASS}>{t('app.coachHome.firstSteps.title')}</h2>
      <ul className="-mx-2 grid gap-1 md:grid-cols-2">
        {STEPS.map((step, index) => (
          <li key={step.to}>
            <Link to={step.to} className={ROW_LINK_CLASS}>
              <span className="numeral text-primary-readable w-8 text-center text-2xl">
                {index + 1}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-medium">{t(`app.coachHome.firstSteps.${step.title}`)}</span>
                <span className="text-muted text-sm">
                  {t(`app.coachHome.firstSteps.${step.hint}`)}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="text-muted size-5" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
