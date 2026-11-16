import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/core/ui';

import type { CycleEditorAction } from '../model/cycle-editor';
import type { ProgramBlock, ProgramDay } from '../model/program-document';
import { SelectField } from './SelectField';
import { useDayLabel } from '../shared/useDayText';
import { useProgramClipboard } from './useProgramClipboard';

interface DayCopyActionsProps {
  block: ProgramBlock;
  day: ProgramDay;
  onChange: (action: CycleEditorAction) => void;
}

/** Lo que se va a sustituir, a la espera de confirmación. */
type Pending = { target: ProgramDay; source: ProgramDay };

/**
 * Copiar un día (PR 2.11, D-080): duplicarlo en otro día del mismo ciclo,
 * copiarlo para pegarlo en otra rutina, o pegar aquí el que se copió. Si el
 * día de destino ya tiene ejercicios, se pregunta antes de sustituirlos.
 */
export function DayCopyActions({ block, day, onChange }: DayCopyActionsProps) {
  const { t } = useTranslation();
  const label = useDayLabel(block);
  const { clipboard, copy } = useProgramClipboard();
  const others = block.days.filter((other) => other.dayNumber !== day.dayNumber);
  const [targetNumber, setTargetNumber] = useState(String(others[0]?.dayNumber ?? ''));
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const replace = ({ target, source }: Pending) => {
    onChange({ type: 'replaceDay', dayNumber: target.dayNumber, source });
    setPending(null);
    setNotice(t('programs.copy.dayReplaced', { day: label(target.dayNumber) }));
  };
  // Con ejercicios en el destino, se pregunta antes.
  const ask = (next: Pending) => {
    setNotice(null);
    if (next.target.exercises.length > 0) {
      setPending(next);
    } else {
      replace(next);
    }
  };
  const target = others.find((other) => String(other.dayNumber) === targetNumber);

  return (
    <div className="border-border flex flex-col gap-3 border-t pt-4">
      {day.kind === 'training' ? (
        <div className="flex flex-wrap items-end gap-2">
          {others.length > 0 ? (
            <>
              <SelectField
                label={t('programs.copy.duplicateDayTo')}
                value={targetNumber}
                options={others.map((other) => ({
                  value: String(other.dayNumber),
                  label: label(other.dayNumber),
                }))}
                onChange={setTargetNumber}
              />
              <Button
                variant="secondary"
                disabled={target === undefined}
                onClick={() => {
                  if (target !== undefined) {
                    ask({ target, source: day });
                  }
                }}
              >
                {t('programs.copy.duplicateDay')}
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            onClick={() => {
              copy({ kind: 'day', day });
              setNotice(t('programs.copy.dayCopied'));
            }}
          >
            {t('programs.copy.copyDay')}
          </Button>
        </div>
      ) : null}

      {clipboard?.kind === 'day' ? (
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => ask({ target: day, source: clipboard.day })}
        >
          {t('programs.copy.pasteDay')}
        </Button>
      ) : null}

      {pending !== null ? (
        <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
          <p className="text-sm">
            {t('programs.copy.replaceConfirm', {
              day: label(pending.target.dayNumber),
              count: pending.target.exercises.length,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => replace(pending)}>{t('programs.copy.replaceYes')}</Button>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {t('programs.form.cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      {notice !== null ? (
        <p aria-live="polite" className="text-sm font-medium">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
