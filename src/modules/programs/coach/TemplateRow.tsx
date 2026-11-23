import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useLanguage } from '@/core/i18n';
import { formatDate, logger } from '@/core/lib';
import { Button, Input } from '@/core/ui';

import { useTemplateAction } from '../api/useTemplates';
import { templateNameSchema } from '../model/program-document';
import { describeCycle } from '../model/template-list';
import type { TemplateSummary } from '../model/template-list';
import { AssignDialog } from './AssignDialog';
import { AssignForm } from './AssignForm';
import { TEMPLATE_ACTION_ERRORS } from './template-action-errors';

export type TemplateNotice = 'renamed' | 'archived' | 'unarchived' | 'duplicated' | 'assigned';

interface TemplateRowProps {
  template: TemplateSummary;
  onDone: (notice: TemplateNotice, name: string) => void;
}

/**
 * Una plantilla: su nombre, cómo es el ciclo, cuántos días de entreno tiene y
 * cuándo se editó; con "Asignar" (PR 2.13), "Renombrar" y "Archivar" o
 * "Recuperar".
 */
export function TemplateRow({ template, onDone }: TemplateRowProps) {
  const { t } = useTranslation();
  const language = useLanguage();
  const action = useTemplateAction();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [name, setName] = useState(template.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const isArchived = template.archivedAt !== null;

  const cycle = describeCycle(template);
  const details = [
    cycle.kind === 'weekly' ? t('programs.list.weekly') : null,
    cycle.kind === 'cycle' ? t('programs.list.cycle', { count: cycle.cycleDays }) : null,
    cycle.kind === 'blocks' ? t('programs.list.blocks', { count: cycle.blocks }) : null,
    cycle.kind === 'blocks' ? null : t('programs.list.trainingDays', { count: cycle.trainingDays }),
    t('programs.list.edited', { date: formatDate(template.updatedAt, language) }),
  ].filter((detail) => detail !== null);

  const run = (variables: Parameters<typeof action.mutateAsync>[0], then: () => void) => {
    setFailure(null);
    action
      .mutateAsync(variables)
      .then((result) => {
        if (result.status === 'saved') {
          then();
        } else {
          setFailure(t(TEMPLATE_ACTION_ERRORS[result.status]));
        }
      })
      .catch((error: unknown) => {
        logger.error('Template action failed', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setFailure(t('core.errors.unexpected'));
      });
  };

  const rename = (event: FormEvent) => {
    event.preventDefault();
    const parsed = templateNameSchema.safeParse(name);
    if (!parsed.success) {
      setNameError(t(parsed.error.issues[0]?.message ?? 'programs.form.nameRequired'));
      return;
    }
    setNameError(null);
    run({ kind: 'rename', id: template.id, name: parsed.data }, () => {
      setIsRenaming(false);
      onDone('renamed', parsed.data);
    });
  };

  return (
    <li className="border-border/60 flex flex-col gap-3 border-b px-2 py-4 last:border-b-0">
      {isRenaming ? (
        <form noValidate onSubmit={rename} className="flex flex-col gap-3">
          <Input
            label={t('programs.list.renameLabel', { name: template.name })}
            name="name"
            maxLength={80}
            value={name}
            error={nameError ?? undefined}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={action.isPending}>
              {t('programs.form.save')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsRenaming(false);
                setName(template.name);
                setNameError(null);
              }}
            >
              {t('programs.form.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            {/* Pulsar el nombre abre el editor (PR 2.8). */}
            <Link
              to={`/coach/programs/${template.id}`}
              className="focus-ring text-foreground rounded-md text-lg font-semibold tracking-tight break-words underline-offset-4 hover:underline"
            >
              {template.name}
            </Link>
            <span className="text-muted text-sm">{details.join(' · ')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {isArchived ? null : (
              <Button
                aria-label={`${t('programs.list.assign')}: ${template.name}`}
                onClick={() => setIsAssigning(true)}
              >
                {t('programs.list.assign')}
              </Button>
            )}
            {isArchived ? null : (
              <Button
                variant="ghost"
                aria-label={`${t('programs.list.rename')}: ${template.name}`}
                onClick={() => setIsRenaming(true)}
              >
                {t('programs.list.rename')}
              </Button>
            )}
            {/* Una plantilla nueva igual que esta: "Copia de …" (PR 2.11). */}
            {isArchived ? null : (
              <Button
                variant="ghost"
                disabled={action.isPending}
                aria-label={`${t('programs.list.duplicate')}: ${template.name}`}
                onClick={() => {
                  const name = t('programs.list.copyName', { name: template.name });
                  run({ kind: 'duplicate', id: template.id, name }, () =>
                    onDone('duplicated', name),
                  );
                }}
              >
                {t('programs.list.duplicate')}
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={action.isPending}
              aria-label={`${t(isArchived ? 'programs.list.unarchive' : 'programs.list.archive')}: ${template.name}`}
              onClick={() =>
                run({ kind: 'archive', id: template.id, archived: !isArchived }, () =>
                  onDone(isArchived ? 'unarchived' : 'archived', template.name),
                )
              }
            >
              {t(isArchived ? 'programs.list.unarchive' : 'programs.list.archive')}
            </Button>
          </div>
        </div>
      )}
      {isAssigning ? (
        <AssignDialog
          title={t('programs.assign.title', { name: template.name })}
          onClose={() => setIsAssigning(false)}
        >
          <AssignForm
            template={template}
            onCancel={() => setIsAssigning(false)}
            onAssigned={() => {
              setIsAssigning(false);
              onDone('assigned', template.name);
            }}
          />
        </AssignDialog>
      ) : null}
      {failure !== null ? (
        <p role="alert" className="text-danger text-sm font-medium">
          {failure}
        </p>
      ) : null}
    </li>
  );
}
