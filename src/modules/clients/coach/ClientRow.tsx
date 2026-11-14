import { useTranslation } from 'react-i18next';

import { brandInitials } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import type { TenantMember } from '@/core/tenancy';

import { isNewClient } from '../model/client-list';

interface ClientRowProps {
  client: TenantMember;
  now: number;
}

/** Una fila de la lista: iniciales, nombre, fecha de alta y "Nuevo" (D-059). */
export function ClientRow({ client, now }: ClientRowProps) {
  const { t } = useTranslation();
  const language = useLanguage();

  return (
    <li className="border-border flex min-h-14 items-center gap-3 border-b py-2 last:border-b-0">
      <span
        aria-hidden="true"
        className="bg-surface border-border flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
      >
        {brandInitials(client.displayName)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{client.displayName}</span>
        <span className="text-muted text-sm">
          {t('clients.list.joinedOn', { date: formatDate(client.joinedAt, language) })}
        </span>
      </div>
      {isNewClient(client.joinedAt, now) ? (
        <span className="bg-primary text-on-primary rounded-full px-2 py-0.5 text-xs font-semibold">
          {t('clients.list.new')}
        </span>
      ) : null}
    </li>
  );
}
