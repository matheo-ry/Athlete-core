import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/core/ui';

import type { ProgramMode } from '../model/assignments';
import { templateNameSchema } from '../model/program-document';
import { FormFrame, isValidDate } from './FormFrame';
import type { FormProps } from './FormFrame';
import { ModeChoice } from './ModeChoice';

/** "Crear desde cero" (D-078): nombre, días del ciclo, fecha de inicio y modo. */
export function CreateFromScratchForm({ clientId, ...props }: FormProps & { clientId: string }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [cycleDays, setCycleDays] = useState('7');
  const [startsOn, setStartsOn] = useState(props.today);
  const [mode, setMode] = useState<ProgramMode>('calendar');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = () => {
    const days = Number(cycleDays);
    const parsed = templateNameSchema.safeParse(name);
    if (!parsed.success) {
      setProblem(t(parsed.error.issues[0]?.message ?? 'programs.form.nameRequired'));
    } else if (!Number.isInteger(days) || days < 1 || days > 28) {
      setProblem(t('programs.form.cycleDaysInvalid'));
    } else if (!isValidDate(startsOn, props.today)) {
      setProblem(t('programs.assign.invalidDate'));
    } else {
      setProblem(null);
      props.onRun({ kind: 'create', clientId, name: parsed.data, cycleDays: days, startsOn, mode });
    }
  };

  return (
    <FormFrame
      title={t('programs.clientActions.create')}
      submitLabel={t('programs.clientActions.createSubmit')}
      isPending={props.isPending}
      error={problem ?? props.failure}
      onSubmit={submit}
      onCancel={props.onCancel}
    >
      <Input
        label={t('programs.form.name')}
        value={name}
        maxLength={80}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label={t('programs.form.cycleDays')}
        type="number"
        inputMode="numeric"
        min={1}
        max={28}
        value={cycleDays}
        onChange={(e) => setCycleDays(e.target.value)}
      />
      <Input
        type="date"
        label={t('programs.assign.startsOn')}
        value={startsOn}
        onChange={(e) => setStartsOn(e.target.value)}
      />
      <ModeChoice value={mode} onChange={setMode} />
    </FormFrame>
  );
}
