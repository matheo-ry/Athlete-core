import { useTranslation } from 'react-i18next';

import { useTenancy } from '@/core/tenancy';
import { Card, EmptyState } from '@/core/ui';

/** Inicio de ejemplo del coach (Fase 0). El contenido real llega con cada módulo. */
export function CoachHomePage() {
  const { t } = useTranslation();
  const { tenant } = useTenancy();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('app.coachHome.title')}</h1>
        <p className="text-muted">{t('app.coachHome.description')}</p>
      </header>
      {tenant ? (
        <Card>
          <p className="text-muted text-sm">{t('app.coachHome.businessLabel')}</p>
          <p className="text-lg font-semibold">{tenant.name}</p>
        </Card>
      ) : null}
      <Card>
        <EmptyState
          title={t('app.coachHome.emptyTitle')}
          description={t('app.coachHome.emptyDescription')}
        />
      </Card>
    </section>
  );
}
