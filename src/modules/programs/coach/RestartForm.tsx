import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/core/ui';

import type { ClientProgram } from '../model/assignments';
import { calendarPosition } from '../model/calendar';
import { FormFrame, isValidDate } from './FormFrame';
import type { FormProps } from './FormFrame';
import { SelectField } from './SelectField';

/** "Reiniciar desde una fecha" (D-083): la fecha y el bloque, por defecto el que iba. */
export function RestartForm({ program, ...props }: FormProps & { program: ClientProgram }) {
  const { t } = useTranslation();
  const position = calendarPosition(
    program.blocks,
    program.startsOn,
    props.today,
    program.startBlockId,
  );
  const currentIndex = position.status === 'running' ? position.blockIndex : 0;
  const [startsOn, setStartsOn] = useState(props.today);
  const [blockId, setBlockId] = useState(
    program.blocks[currentIndex]?.id ?? program.blocks[0]?.id ?? '',
  );
  const [problem, setProblem] = useState<string | null>(null);

  const submit = () => {
    if (!isValidDate(startsOn, props.today)) {
      setProblem(t('programs.assign.invalidDate'));
      return;
    }
    setProblem(null);
    props.onRun({ kind: 'restart', programId: program.id, startsOn, blockId });
  };

  return (
    <FormFrame
      title={t('programs.clientActions.restart')}
      submitLabel={t('programs.clientActions.restartSubmit')}
      isPending={props.isPending}
      error={problem ?? props.failure}
      onSubmit={submit}
      onCancel={props.onCancel}
    >
      <Input
        type="date"
        label={t('programs.clientActions.restartDate')}
        value={startsOn}
        onChange={(e) => setStartsOn(e.target.value)}
      />
      {program.blocks.length > 1 ? (
        <SelectField
          label={t('programs.clientActions.restartBlock')}
          value={blockId}
          options={program.blocks.map((block, index) => ({
            value: block.id ?? '',
            label: t('programs.clientActions.blockOption', { number: index + 1 }),
          }))}
          onChange={setBlockId}
        />
      ) : null}
    </FormFrame>
  );
}
