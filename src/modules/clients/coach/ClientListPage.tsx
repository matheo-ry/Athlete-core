import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { useTenantMembers } from '@/core/tenancy';
import { Card, EmptyState, ErrorState, Input, Spinner } from '@/core/ui';
import { cn } from '@/core/lib';

import { visibleClients } from '../model/client-list';
import type { ClientTab } from '../model/client-list';
import { ClientRow } from './ClientRow';
import { InviteCodeCard } from './InviteCodeCard';
import { SeatsSummary } from './SeatsSummary';

const TABS: readonly ClientTab[] = ['active', 'archived'];

/**
 * Los clientes del coach (D-059): pestañas "Activos" y "Dados de baja",
 * buscador, plazas del plan y la tarjeta del código de invitación.
 */
export function ClientListPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const members = useTenantMembers();
  const [tab, setTab] = useState<ClientTab>('active');
  const [query, setQuery] = useState('');
  // La hora "actual" se fija al abrir la pantalla: así "Nuevo" no cambia mientras se mira.
  const [now] = useState(() => Date.now());

  const clients = visibleClients(members.data ?? [], tab, query, language);
  const hasAnyInTab = visibleClients(members.data ?? [], tab, '', language).length > 0;

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('clients.list.title')}</h1>
        <p className="text-muted">{t('clients.list.description')}</p>
      </header>

      {members.data !== undefined ? <SeatsSummary members={members.data} /> : null}
      <InviteCodeCard />

      <div role="group" aria-label={t('clients.list.tabsLabel')} className="flex gap-2">
        {TABS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={tab === option}
            onClick={() => setTab(option)}
            className={cn(
              'min-h-11 rounded-lg px-4 text-sm font-medium',
              'focus-visible:outline-primary-readable focus-visible:outline-2',
              tab === option ? 'bg-primary text-on-primary' : 'bg-surface text-muted',
            )}
          >
            {t(`clients.list.tabs.${option}`)}
          </button>
        ))}
      </div>

      <Input
        label={t('clients.list.search')}
        type="search"
        name="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <Card>
        {members.isPending ? <Spinner /> : null}
        {members.isError ? <ErrorState onRetry={() => void members.refetch()} /> : null}
        {members.isSuccess && !hasAnyInTab ? (
          <EmptyState
            title={t(
              tab === 'active' ? 'clients.list.empty.title' : 'clients.list.emptyArchived.title',
            )}
            description={t(
              tab === 'active'
                ? 'clients.list.empty.description'
                : 'clients.list.emptyArchived.description',
            )}
          />
        ) : null}
        {members.isSuccess && hasAnyInTab && clients.length === 0 ? (
          <p className="text-muted py-6 text-center text-sm">
            {t('clients.list.noResults', { query })}
          </p>
        ) : null}
        {clients.length > 0 ? (
          <ul>
            {clients.map((client) => (
              <ClientRow key={client.userId} client={client} now={now} />
            ))}
          </ul>
        ) : null}
      </Card>
    </section>
  );
}
