import { useTranslation } from 'react-i18next';

import { useTenancy } from '@/core/tenancy';
import { Card, EmptyState } from '@/core/ui';

/** Inicio de ejemplo del cliente (Fase 0). El entreno de hoy llega en la Fase 3. */
export function ClientHomePage() {
  const { t } = useTranslation();
  const { tenant } = useTenancy();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.clientHome.title')}</h1>
        <p className="text-muted">{t('app.clientHome.description')}</p>
      </header>
      {tenant ? (
        <Card>
          <p className="text-muted text-sm">{t('app.clientHome.coachLabel')}</p>
          <p className="text-lg font-semibold">{tenant.name}</p>
        </Card>
      ) : null}
      <Card>
        <EmptyState
          title={t('app.clientHome.emptyTitle')}
          description={t('app.clientHome.emptyDescription')}
        />
      </Card>
    </section>
  );
}
