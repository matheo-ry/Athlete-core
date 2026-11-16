import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { useTenantMembers } from '@/core/tenancy';
import { Card, EmptyState, ErrorState, Input, Spinner } from '@/core/ui';

import { useClientPrograms } from '../api/useAssignments';
import { routinesByClient } from '../model/assignments';
import { localToday } from '../model/calendar';
import { ClientRoutineRow } from './ClientRoutineRow';

/**
 * La pestaña "Asignadas" (PR 2.13b, D-085): cada cliente activo con su
 * rutina, para ver de un vistazo quién se queda sin ella. Buscador por nombre.
 */
export function AssignedList() {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = useMemo(() => localToday(), []);
  const members = useTenantMembers();
  const programs = useClientPrograms();
  const [query, setQuery] = useState('');

  const clients = useMemo(
    () =>
      (members.data ?? [])
        .filter((member) => member.role === 'client' && member.status === 'active')
        .sort((a, b) => a.displayName.localeCompare(b.displayName, language)),
    [members.data, language],
  );
  const routines = useMemo(
    () => routinesByClient(programs.data ?? [], today),
    [programs.data, today],
  );
  const search = query.trim().toLocaleLowerCase();
  const visible = clients.filter((client) =>
    client.displayName.toLocaleLowerCase().includes(search),
  );
  const isPending = members.isPending || programs.isPending;
  const isError = members.isError || programs.isError;

  return (
    <>
      <Input
        label={t('programs.assigned.search')}
        type="search"
        name="search-clients"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Card>
        {isPending ? <Spinner /> : null}
        {isError ? (
          <ErrorState
            onRetry={() => {
              void members.refetch();
              void programs.refetch();
            }}
          />
        ) : null}
        {!isPending && !isError && clients.length === 0 ? (
          <EmptyState
            title={t('programs.assigned.empty.title')}
            description={t('programs.assigned.empty.description')}
          />
        ) : null}
        {!isPending && !isError && clients.length > 0 && visible.length === 0 ? (
          <EmptyState
            title={t('programs.assigned.noResults.title')}
            description={t('programs.assigned.noResults.description')}
          />
        ) : null}
        {!isPending && !isError && visible.length > 0 ? (
          <ul aria-label={t('programs.assigned.listLabel')}>
            {visible.map((client) => (
              <ClientRoutineRow
                key={client.userId}
                name={client.displayName}
                routines={routines.get(client.userId)}
                today={today}
              />
            ))}
          </ul>
        ) : null}
      </Card>
    </>
  );
}
