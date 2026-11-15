import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { buttonClassName, ErrorState, Spinner } from '@/core/ui';

import { useProgram } from '../api/useProgram';
import { ProgramEditor } from './ProgramEditor';

/**
 * `/coach/programs/:programId`: carga la rutina y abre el editor. Cada vez que
 * se guarda, el editor vuelve a empezar desde lo guardado (la clave es el
 * `updated_at`).
 */
export function ProgramEditorPage() {
  const { t } = useTranslation();
  const { programId = '' } = useParams();
  const program = useProgram(programId);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <Link to="/coach/programs" className={buttonClassName('ghost', 'self-start')}>
        {t('programs.editor.backToList')}
      </Link>
      {program.isPending ? <Spinner /> : null}
      {program.isError ? <ErrorState onRetry={() => void program.refetch()} /> : null}
      {program.isSuccess ? (
        <>
          <header>
            <h1 className="text-2xl font-bold break-words">{program.data.name}</h1>
            <p className="text-muted">{t('programs.editor.description')}</p>
          </header>
          {savedAt !== null && Date.parse(savedAt) === Date.parse(program.data.updatedAt ?? '') ? (
            <p role="status" className="text-sm font-medium">
              {t('programs.editor.saved')}
            </p>
          ) : null}
          <ProgramEditor
            key={program.data.updatedAt}
            saved={program.data}
            // Al guardar, useSaveProgram ya vuelve a pedir la rutina.
            onSaved={setSavedAt}
            onReload={() => void program.refetch()}
          />
        </>
      ) : null}
    </section>
  );
}
