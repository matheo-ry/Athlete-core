import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';

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
  const share = limit.maxClients === 0 ? 1 : Math.min(1, used / limit.maxClients);
  return (
    <div className="surface flex flex-col gap-3 rounded-2xl p-4 md:p-5">
      <p className="numeric text-lg font-medium">
        {t('clients.seats.used', { used, max: limit.maxClients })}
      </p>
      <div aria-hidden="true" className="bg-foreground/10 h-2 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full', isFull ? 'bg-danger' : 'bg-primary')}
          style={{ width: `${String(share * 100)}%` }}
        />
      </div>
      {isFull ? (
        <p role="status" className="bg-danger-soft text-danger rounded-xl px-3 py-2.5 text-sm">
          {t('clients.seats.full')}
        </p>
      ) : null}
    </div>
  );
}
