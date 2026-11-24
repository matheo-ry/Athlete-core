import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { brandInitials } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import { useClientProfileTabs } from '@/core/modules';
import { formatDate } from '@/core/lib';
import { useTenancy, useTenantMembers } from '@/core/tenancy';
import { buttonClassName, Card, EmptyState, ErrorState, Icon, Spinner } from '@/core/ui';

import { ClientProfileTabs } from './ClientProfileTabs';
import { ClientStatusActions } from './ClientStatusActions';

/**
 * La ficha de un cliente (D-059): nombre, fecha de alta, estado y, para el
 * dueño, dar de baja o reactivar (D-055). Debajo, las pestañas que aportan
 * los módulos activos (la "Rutina" de programs, PR 2.14), sin importarlos.
 */
export function ClientDetailPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const { clientId } = useParams();
  const { role } = useTenancy();
  const members = useTenantMembers();
  const tabs = useClientProfileTabs();
  const client = members.data?.find(
    (member) => member.userId === clientId && member.role === 'client',
  );

  const back = (
    <Link to="/coach/clients" className={buttonClassName('ghost', '-ml-3 self-start pl-2')}>
      <Icon name="chevronLeft" className="size-5" />
      {t('clients.detail.back')}
    </Link>
  );

  if (members.isPending) {
    return <Spinner />;
  }
  if (members.isError) {
    return <ErrorState onRetry={() => void members.refetch()} />;
  }
  if (client === undefined) {
    return (
      <section className="flex flex-col gap-4">
        {back}
        <EmptyState title={t('clients.detail.notFound')} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {back}
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="bg-primary-soft text-primary-readable ring-primary/25 flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold ring-1 md:size-20 md:text-2xl"
        >
          {brandInitials(client.displayName)}
        </span>
        <div className="flex flex-col">
          <h1 className="text-3xl leading-[1.08] font-semibold md:text-4xl">
            {client.displayName}
          </h1>
          <p className="text-muted text-sm">
            {t('clients.detail.joinedOn', { date: formatDate(client.joinedAt, language) })}
            {' · '}
            {client.status === 'active'
              ? t('clients.detail.statusActive')
              : t('clients.detail.statusArchived')}
          </p>
        </div>
      </header>

      {role === 'owner' ? <ClientStatusActions client={client} /> : null}

      {tabs.length > 0 ? (
        <ClientProfileTabs tabs={tabs} client={client} />
      ) : (
        <Card>
          <p className="text-muted text-sm">{t('clients.detail.comingTabs')}</p>
        </Card>
      )}
    </section>
  );
}
