import { useTranslation } from 'react-i18next';

import { useAuth, useProfile } from '@/core/auth';
import { PageHeader } from '@/core/ui';

import { useClientProgress } from '../api/useClientProgress';
import { ProgressView } from '../shared/ProgressView';

/**
 * Pantalla de progreso del cliente (/client/progress, D-129, D-131).
 * Enseña los ejercicios hechos, agrupados por rutina, con el último,
 * el récord, el historial en texto ("DIA 1: 45×8(1)...") y descargar en Excel.
 */
export function ClientProgressPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const profile = useProfile();
  const { groups, rawWorkouts, exerciseOptionsById, isPending, isError, refetch, unit } =
    useClientProgress(user?.id ?? null);

  const clientName = profile.data?.displayName || user?.email?.split('@')[0];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t('progress.title')} />

      <ProgressView
        clientId={user?.id ?? null}
        groups={groups}
        rawWorkouts={rawWorkouts}
        exerciseOptionsById={exerciseOptionsById}
        clientName={clientName}
        isPending={isPending}
        isError={isError}
        onRetry={() => void refetch()}
        unit={unit}
        isCoach={false}
      />
    </section>
  );
}
