import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/core/ui';

import type { ClientProgram } from '../model/assignments';
import { templateNameSchema } from '../model/program-document';
import { FormFrame } from './FormFrame';
import type { FormProps } from './FormFrame';

/** "Guardar como plantilla" (D-078): una plantilla nueva igual que la rutina. */
export function SaveAsTemplateForm({ program, ...props }: FormProps & { program: ClientProgram }) {
  const { t } = useTranslation();
  const [name, setName] = useState(program.name);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = () => {
    const parsed = templateNameSchema.safeParse(name);
    if (!parsed.success) {
      setProblem(t(parsed.error.issues[0]?.message ?? 'programs.form.nameRequired'));
      return;
    }
    setProblem(null);
    props.onRun({ kind: 'saveAsTemplate', programId: program.id, name: parsed.data });
  };

  return (
    <FormFrame
      title={t('programs.clientActions.saveAsTemplate')}
      submitLabel={t('programs.form.save')}
      isPending={props.isPending}
      error={problem ?? props.failure}
      onSubmit={submit}
      onCancel={props.onCancel}
    >
      <Input
        label={t('programs.clientActions.templateName')}
        value={name}
        maxLength={80}
        onChange={(e) => setName(e.target.value)}
      />
    </FormFrame>
  );
}
