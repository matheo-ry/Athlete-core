import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/core/i18n';
import { logger } from '@/core/lib';
import { useTenantMembers } from '@/core/tenancy';
import { Button, ErrorState, Input, Spinner } from '@/core/ui';

import { useAssignProgram, useClientPrograms } from '../api/useAssignments';
import { useProgram } from '../api/useProgram';
import { assignmentWarnings, routinesByClient } from '../model/assignments';
import type { ProgramMode } from '../model/assignments';
import { daysBetween, localToday } from '../model/calendar';
import { AssignSummary } from './AssignSummary';
import { ClientChoice } from './ClientChoice';
import { ModeChoice } from './ModeChoice';

interface AssignFormProps {
  template: { id: string; name: string };
  onCancel: () => void;
  onAssigned: () => void;
}

/** Un año hacia atrás o hacia delante, como la base de datos (D-105). */
const MAX_DAYS = 366;

const ERRORS = {
  offline: 'core.errors.offline',
  client_not_found: 'programs.assign.errors.clientNotFound',
  template_archived: 'programs.assign.errors.templateArchived',
  error: 'core.errors.unexpected',
} as const;

/**
 * Elegir clientes, fecha de inicio y modo (D-081 y D-082), y antes de
 * confirmar, el resumen: cuándo termina y a quién se le sustituye una rutina.
 */
export function AssignForm({ template, onCancel, onAssigned }: AssignFormProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = useMemo(() => localToday(), []);
  const members = useTenantMembers();
  const programs = useClientPrograms();
  const document = useProgram(template.id);
  const assign = useAssignProgram();
  const [selected, setSelected] = useState<string[]>([]);
  const [startsOn, setStartsOn] = useState(today);
  const [mode, setMode] = useState<ProgramMode>('calendar');
  const [problem, setProblem] = useState<string | null>(null);

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

  if (members.isPending || programs.isPending || document.isPending) {
    return <Spinner />;
  }
  if (members.isError || programs.isError || document.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void members.refetch();
          void programs.refetch();
          void document.refetch();
        }}
      />
    );
  }
  if (clients.length === 0) {
    return <p className="text-muted">{t('programs.assign.noClients')}</p>;
  }

  const isValidDate =
    /^\d{4}-\d{2}-\d{2}$/.test(startsOn) && Math.abs(daysBetween(today, startsOn)) <= MAX_DAYS;
  const names = new Map(clients.map((client) => [client.userId, client.displayName]));
  const warnings = isValidDate ? assignmentWarnings(selected, routines, startsOn, today) : [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selected.length === 0) {
      setProblem(t('programs.assign.pickClient'));
      return;
    }
    if (!isValidDate) {
      setProblem(t('programs.assign.invalidDate'));
      return;
    }
    setProblem(null);
    assign
      .mutateAsync({ templateId: template.id, clientIds: selected, startsOn, mode, today })
      .then((result) => {
        if (result.status === 'assigned') {
          onAssigned();
        } else {
          setProblem(t(ERRORS[result.status]));
        }
      })
      .catch((error: unknown) => {
        logger.error('Assign failed', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setProblem(t('core.errors.unexpected'));
      });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <ClientChoice
        clients={clients}
        routines={routines}
        selected={selected}
        onChange={setSelected}
      />
      <Input
        type="date"
        label={t('programs.assign.startsOn')}
        value={startsOn}
        required
        onChange={(event) => setStartsOn(event.target.value)}
      />
      <ModeChoice value={mode} onChange={setMode} />
      {isValidDate ? (
        <AssignSummary
          blocks={document.data.blocks}
          startsOn={startsOn}
          today={today}
          warnings={warnings.map((warning) => ({
            ...warning,
            clientName: names.get(warning.clientId) ?? '',
          }))}
        />
      ) : null}
      {problem !== null ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {problem}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={assign.isPending}>
          {t('programs.assign.confirm', { count: Math.max(selected.length, 1) })}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('programs.form.cancel')}
        </Button>
      </div>
    </form>
  );
}
