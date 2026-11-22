import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { brandInitials } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import type { TenantMember } from '@/core/tenancy';
import { Icon, Pill } from '@/core/ui';

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
    <li>
      <Link
        to={`/coach/clients/${encodeURIComponent(client.userId)}`}
        className="focus-ring hover:bg-foreground/5 group flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2 transition-colors"
      >
        <span
          aria-hidden="true"
          className="bg-primary-soft text-primary-readable ring-primary/20 flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1"
        >
          {brandInitials(client.displayName)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{client.displayName}</span>
          <span className="text-muted text-sm">
            {t('clients.list.joinedOn', { date: formatDate(client.joinedAt, language) })}
          </span>
        </span>
        {isNewClient(client.joinedAt, now) ? (
          <Pill tone="primary">{t('clients.list.new')}</Pill>
        ) : null}
        <Icon
          name="chevronRight"
          className="text-muted size-5 shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}
