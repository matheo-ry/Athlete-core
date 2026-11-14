import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { brandInitials } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import type { TenantMember } from '@/core/tenancy';

import { isNewClient } from '../model/client-list';

interface ClientRowProps {
  client: TenantMember;
  now: number;
}

/** Una fila de la lista: iniciales, nombre, fecha de alta y "Nuevo" (D-059). Abre su ficha. */
export function ClientRow({ client, now }: ClientRowProps) {
  const { t } = useTranslation();
  const language = useLanguage();

  return (
    <li className="border-border border-b last:border-b-0">
      <Link
        to={`/coach/clients/${encodeURIComponent(client.userId)}`}
        className="hover:bg-surface focus-visible:outline-primary-readable flex min-h-14 items-center gap-3 rounded-lg px-1 py-2 focus-visible:outline-2"
      >
        <span
          aria-hidden="true"
          className="bg-surface border-border flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
        >
          {brandInitials(client.displayName)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{client.displayName}</span>
          <span className="text-muted text-sm">
            {t('clients.list.joinedOn', { date: formatDate(client.joinedAt, language) })}
          </span>
        </span>
        {isNewClient(client.joinedAt, now) ? (
          <span className="bg-primary text-on-primary rounded-full px-2 py-0.5 text-xs font-semibold">
            {t('clients.list.new')}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
