import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { useTenantMembers } from '@/core/tenancy';
import { buttonClassName, ErrorState, Spinner } from '@/core/ui';

import { useProgram } from '../api/useProgram';
import { ProgramEditor } from './ProgramEditor';

/**
 * `/coach/programs/:programId`: carga la rutina y abre el editor. Cada vez que
 * se guarda, el editor vuelve a empezar desde lo guardado (la clave es el
 * `updated_at`). La rutina de un cliente dice de quién es y vuelve a su
 * ficha (PR 2.14).
 */
export function ProgramEditorPage() {
  const { t } = useTranslation();
  const { programId = '' } = useParams();
  const program = useProgram(programId);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const members = useTenantMembers();
  const clientId = program.data?.clientId ?? null;
  const clientName =
    clientId === null
      ? null
      : (members.data?.find((member) => member.userId === clientId)?.displayName ?? '');

  return (
    <section className="flex flex-col gap-4">
      <Link
        to={clientId === null ? '/coach/programs' : `/coach/clients/${clientId}`}
        className={buttonClassName('ghost', 'self-start')}
      >
        {clientId === null
          ? t('programs.editor.backToList')
          : t('programs.editor.backToClient', { name: clientName })}
      </Link>
      {program.isPending ? <Spinner /> : null}
      {program.isError ? <ErrorState onRetry={() => void program.refetch()} /> : null}
      {program.isSuccess ? (
        <>
          <header>
            {clientName === null ? null : (
              <p className="text-primary-readable text-sm font-semibold">
                {t('programs.editor.clientProgram', { name: clientName })}
              </p>
            )}
            <h1 className="text-2xl font-bold break-words">{program.data.name}</h1>
            <p className="text-muted">{t('programs.editor.description')}</p>
          </header>
          <ProgramEditor
            key={program.data.updatedAt}
            saved={program.data}
            justSaved={
              savedAt !== null && Date.parse(savedAt) === Date.parse(program.data.updatedAt ?? '')
            }
            // Al guardar, useSaveProgram ya vuelve a pedir la rutina.
            onSaved={setSavedAt}
            onReload={() => void program.refetch()}
          />
        </>
      ) : null}
    </section>
  );
}
