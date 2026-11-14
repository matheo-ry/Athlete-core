import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { brandInitials } from '@/core/branding';
import { useLanguage } from '@/core/i18n';
import { formatDate } from '@/core/lib';
import { useTenancy, useTenantMembers } from '@/core/tenancy';
import { Card, EmptyState, ErrorState, Spinner, buttonClassName } from '@/core/ui';

import { ClientStatusActions } from './ClientStatusActions';

/**
 * La ficha de un cliente (D-059): nombre, fecha de alta, estado y, para el
 * dueño, dar de baja o reactivar (D-055). Las pestañas de rutinas y progreso
 * las aportarán esos módulos (Fases 2 y 3).
 */
export function ClientDetailPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const { clientId } = useParams();
  const { role } = useTenancy();
  const members = useTenantMembers();
  const client = members.data?.find(
    (member) => member.userId === clientId && member.role === 'client',
  );

  const back = (
    <Link to="/coach/clients" className={buttonClassName('ghost', 'self-start')}>
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
          className="bg-surface border-border flex size-16 shrink-0 items-center justify-center rounded-full border text-xl font-semibold"
        >
          {brandInitials(client.displayName)}
        </span>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">{client.displayName}</h1>
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

      <Card>
        <p className="text-muted text-sm">{t('clients.detail.comingTabs')}</p>
      </Card>
    </section>
  );
}
