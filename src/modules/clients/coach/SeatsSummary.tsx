import { useTranslation } from 'react-i18next';

import { countActiveClients, usePlanLimit } from '@/core/tenancy';
import type { TenantMember } from '@/core/tenancy';

interface SeatsSummaryProps {
  members: readonly TenantMember[];
}

/** "2 de 3 plazas" y, con el plan lleno, el aviso de que nadie más puede entrar (D-059). */
export function SeatsSummary({ members }: SeatsSummaryProps) {
  const { t } = useTranslation();
  const { data: limit } = usePlanLimit();
  const used = countActiveClients(members);

  if (limit === undefined) {
    return null;
  }
  if (limit.maxClients === null) {
    return <p className="text-muted text-sm">{t('clients.seats.unlimited', { used })}</p>;
  }
  const isFull = used >= limit.maxClients;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {t('clients.seats.used', { used, max: limit.maxClients })}
      </p>
      {isFull ? (
        <p role="status" className="border-danger text-danger rounded-lg border p-3 text-sm">
          {t('clients.seats.full')}
        </p>
      ) : null}
    </div>
  );
}
