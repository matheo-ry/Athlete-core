import { useTranslation } from 'react-i18next';

import { useAuth } from '@/core/auth';

import { useClientProgress } from '../api/useClientProgress';
import { ProgressView } from '../shared/ProgressView';

/**
 * Pantalla de progreso del cliente (/client/progress, D-129).
 * Enseña los ejercicios hechos, agrupados por rutina, con el último,
 * el récord y el historial en texto ("DIA 1: 45×8(1)...").
 */
export function ClientProgressPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { groups, isPending, isError, refetch, unit } = useClientProgress(user?.id ?? null);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t('progress.title')}</h1>
      </header>

      <ProgressView
        groups={groups}
        isPending={isPending}
        isError={isError}
        onRetry={() => void refetch()}
        unit={unit}
      />
    </section>
  );
}
