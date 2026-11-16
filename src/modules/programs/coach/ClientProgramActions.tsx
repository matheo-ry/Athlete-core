import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { logger } from '@/core/lib';
import { Button, Card } from '@/core/ui';

import type { ClientProgramAction } from '../api/client-program-api';
import { useClientProgramAction } from '../api/useClientProgramAction';
import type { ClientProgram } from '../model/assignments';
import { AssignToClient } from './AssignToClient';
import { CreateFromScratchForm } from './CreateFromScratchForm';
import { RestartForm } from './RestartForm';
import { SaveAsTemplateForm } from './SaveAsTemplateForm';

interface ClientProgramActionsProps {
  clientId: string;
  clientName: string;
  current: ClientProgram | null;
  next: ClientProgram | null;
  today: string;
}

type Panel = 'assign' | 'create' | 'restart' | 'end' | 'cancel' | 'saveAsTemplate';

const ERRORS = {
  offline: 'core.errors.offline',
  client_not_found: 'programs.clientActions.errors.clientNotFound',
  template_limit_reached: 'programs.form.limitReached',
  program_already_ended: 'programs.clientActions.errors.changed',
  program_already_started: 'programs.clientActions.errors.changed',
  program_not_started: 'programs.clientActions.errors.changed',
  invalid_start: 'programs.assign.invalidDate',
  error: 'core.errors.unexpected',
} as const;

/**
 * Lo que el coach hace con la rutina de un cliente (PR 2.14b): asignar una
 * plantilla, crear desde cero, reiniciar, terminar, cancelar la próxima y
 * guardar como plantilla. Terminar y cancelar piden confirmación.
 */
export function ClientProgramActions({
  clientId,
  clientName,
  current,
  next,
  today,
}: ClientProgramActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const action = useClientProgramAction();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const open = (value: Panel) => {
    setFailure(null);
    setNotice(null);
    setPanel(value);
  };
  const close = () => {
    setFailure(null);
    setPanel(null);
  };

  const run = (variables: ClientProgramAction) => {
    setFailure(null);
    action
      .mutateAsync(variables)
      .then((result) => {
        if (result.status !== 'done') {
          setFailure(t(ERRORS[result.status]));
          return;
        }
        setPanel(null);
        if (variables.kind === 'create' && result.id !== null) {
          // La rutina nueva tiene todos los días de descanso: se rellena en el editor.
          void navigate(`/coach/programs/${result.id}`);
          return;
        }
        setNotice(
          t(`programs.clientActions.notices.${variables.kind}`, {
            name: variables.kind === 'saveAsTemplate' ? variables.name : '',
          }),
        );
      })
      .catch((error: unknown) => {
        logger.error('Client program action failed', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setFailure(t('core.errors.unexpected'));
      });
  };

  const formProps = { today, isPending: action.isPending, failure, onRun: run, onCancel: close };

  const confirm = (text: string, yes: string, variables: ClientProgramAction) => (
    <Card className="flex flex-col gap-3">
      <p>{text}</p>
      {failure === null ? null : (
        <p role="alert" className="text-danger text-sm font-medium">
          {failure}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={action.isPending} onClick={() => run(variables)}>
          {yes}
        </Button>
        <Button variant="ghost" onClick={close}>
          {t('programs.form.cancel')}
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col gap-3">
      {notice === null ? null : (
        <p role="status" className="text-sm font-medium">
          {notice}
        </p>
      )}
      <div
        role="group"
        aria-label={t('programs.clientActions.label')}
        className="flex flex-wrap gap-2"
      >
        <Button onClick={() => open('assign')}>{t('programs.clientActions.assign')}</Button>
        <Button variant="secondary" onClick={() => open('create')}>
          {t('programs.clientActions.create')}
        </Button>
        {current === null ? null : (
          <>
            <Button variant="secondary" onClick={() => open('restart')}>
              {t('programs.clientActions.restart')}
            </Button>
            <Button variant="secondary" onClick={() => open('saveAsTemplate')}>
              {t('programs.clientActions.saveAsTemplate')}
            </Button>
            <Button variant="secondary" onClick={() => open('end')}>
              {t('programs.clientActions.end')}
            </Button>
          </>
        )}
        {next === null ? null : (
          <Button variant="secondary" onClick={() => open('cancel')}>
            {t('programs.clientActions.cancelNext')}
          </Button>
        )}
      </div>

      {panel === 'assign' ? (
        <AssignToClient
          clientId={clientId}
          clientName={clientName}
          onClose={close}
          onAssigned={(name) => {
            setPanel(null);
            setNotice(t('programs.list.notices.assigned', { name }));
          }}
        />
      ) : null}
      {panel === 'create' ? <CreateFromScratchForm clientId={clientId} {...formProps} /> : null}
      {panel === 'restart' && current !== null ? (
        <RestartForm program={current} {...formProps} />
      ) : null}
      {panel === 'saveAsTemplate' && current !== null ? (
        <SaveAsTemplateForm program={current} {...formProps} />
      ) : null}
      {panel === 'end' && current !== null
        ? confirm(
            t('programs.clientActions.endConfirm', { name: current.name, client: clientName }),
            t('programs.clientActions.endYes'),
            { kind: 'end', programId: current.id },
          )
        : null}
      {panel === 'cancel' && next !== null
        ? confirm(
            t('programs.clientActions.cancelConfirm', { name: next.name }),
            t('programs.clientActions.cancelYes'),
            { kind: 'cancel', programId: next.id },
          )
        : null}
    </div>
  );
}
