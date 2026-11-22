import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from '@/core/ui';

import { useClientPrograms } from '../api/useAssignments';
import { routinesByClient } from '../model/assignments';
import { localToday } from '../model/calendar';
import { shortDate } from '../shared/useProgressText';
import { CurrentProgramView } from './CurrentProgramView';

/**
 * "Entreno" (PR 2.15, D-084): la rutina del cliente en lectura. Sin día
 * elegido, "Hoy toca" y los días; con `?day=`, el día; con `&exercise=`, el
 * ejercicio. En la dirección, para que "atrás" del móvil funcione.
 */
export function ClientProgramPage() {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = useMemo(() => localToday(), []);
  const programs = useClientPrograms();

  // El cliente solo lee sus propias rutinas (RLS): hay como mucho un cliente.
  const routines = [...routinesByClient(programs.data ?? [], today).values()][0];
  const current = routines?.current ?? null;
  const next = routines?.next ?? null;

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t('programs.client.title')} />
      {programs.isPending ? <Spinner /> : null}
      {programs.isError ? <ErrorState onRetry={() => void programs.refetch()} /> : null}
      {programs.isSuccess && current === null && next === null ? (
        <Card>
          <EmptyState title={t('programs.client.noProgram')} />
        </Card>
      ) : null}
      {programs.isSuccess && current === null && next !== null ? (
        <Card>
          <EmptyState
            title={t('programs.client.startsOn', { date: shortDate(next.startsOn, language) })}
            description={next.name}
          />
        </Card>
      ) : null}
      {current === null ? null : <CurrentProgramView program={current} today={today} />}
    </section>
  );
}
