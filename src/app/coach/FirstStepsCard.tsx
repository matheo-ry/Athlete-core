import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { countActiveClients, useTenancy, useTenantMembers } from '@/core/tenancy';
import { Card } from '@/core/ui';

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
    <Card>
      <h2 className="mb-2 font-semibold">{t('app.coachHome.firstSteps.title')}</h2>
      <ul className="flex flex-col">
        {STEPS.map((step) => (
          <li key={step.to}>
            <Link
              to={step.to}
              className="hover:bg-background focus-visible:outline-primary-readable flex min-h-14 items-center gap-3 rounded-lg px-2 focus-visible:outline-2"
            >
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
