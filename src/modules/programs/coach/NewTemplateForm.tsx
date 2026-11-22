import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { logger } from '@/core/lib';
import { Button, Card, Input } from '@/core/ui';

import { useTemplateAction } from '../api/useTemplates';
import { WEEKLY_CYCLE_DAYS, newTemplateSchema } from '../model/program-document';
import { TEMPLATE_ACTION_ERRORS } from './template-action-errors';

interface NewTemplateFormProps {
  onCreated: (id: string) => void;
  onCancel: () => void;
}

type FieldErrors = Partial<Record<'name' | 'cycleDays', string>>;

/** "Nueva plantilla": el nombre y cuántos días dura el ciclo, 7 por defecto (PR 2.7). */
export function NewTemplateForm({ onCreated, onCancel }: NewTemplateFormProps) {
  const { t } = useTranslation();
  const action = useTemplateAction();
  const [name, setName] = useState('');
  const [cycleDays, setCycleDays] = useState(String(WEEKLY_CYCLE_DAYS));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);
    const parsed = newTemplateSchema.safeParse({ name, cycleDays });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === 'name' || field === 'cycleDays') && fieldErrors[field] === undefined) {
          fieldErrors[field] = t(issue.message);
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    action
      .mutateAsync({ kind: 'create', ...parsed.data })
      .then((result) => {
        if (result.status === 'saved') {
          onCreated(result.id);
        } else {
          setFailure(t(TEMPLATE_ACTION_ERRORS[result.status]));
        }
      })
      .catch((error: unknown) => {
        logger.error('Could not create template', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        setFailure(t('core.errors.unexpected'));
      });
  };

  return (
    <Card>
      <form
        noValidate
        onSubmit={submit}
        className="flex flex-col gap-4"
        aria-labelledby="new-template"
      >
        <h2 id="new-template" className="text-lg font-semibold">
          {t('programs.form.newTitle')}
        </h2>
        {failure !== null ? (
          <p role="alert" className="text-danger text-sm font-medium">
            {failure}
          </p>
        ) : null}
        <Input
          label={t('programs.form.name')}
          name="name"
          maxLength={80}
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <Input
          label={t('programs.form.cycleDays')}
          name="cycleDays"
          inputMode="numeric"
          className="w-24"
          value={cycleDays}
          hint={t('programs.form.cycleDaysHint')}
          error={errors.cycleDays}
          onChange={(event) => setCycleDays(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={action.isPending}>
            {t('programs.form.create')}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            {t('programs.form.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
