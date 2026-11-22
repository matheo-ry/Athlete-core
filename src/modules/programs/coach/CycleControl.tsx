import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Input } from '@/core/ui';

import { daysLostWhenShortening, isWeekly } from '../model/cycle-editor';
import type { CycleEditorAction } from '../model/cycle-editor';
import { newTemplateSchema } from '../model/program-document';
import type { ProgramBlock } from '../model/program-document';
import { useDayLabel } from '../shared/useDayText';

interface CycleControlProps {
  block: ProgramBlock;
  onChange: (action: CycleEditorAction) => void;
}

/**
 * Cuántos días dura el ciclo (1 a 28). Con 7 es "Semanal". Acortarlo cuando
 * sobran días con contenido pide confirmación (PR 2.8).
 */
export function CycleControl({ block, onChange }: CycleControlProps) {
  const { t } = useTranslation();
  const label = useDayLabel(block);
  const [value, setValue] = useState(String(block.cycleDays));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ cycleDays: number; lost: number[] } | null>(null);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    const parsed = newTemplateSchema.shape.cycleDays.safeParse(value);
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message ?? 'programs.form.cycleDaysInvalid'));
      return;
    }
    setError(null);
    const lost = daysLostWhenShortening(block, parsed.data);
    if (lost.length > 0) {
      setPending({ cycleDays: parsed.data, lost });
      return;
    }
    onChange({ type: 'setCycleDays', cycleDays: parsed.data });
  };

  return (
    <div className="flex flex-col gap-3">
      <form noValidate onSubmit={apply} className="flex flex-wrap items-end gap-2">
        <Input
          label={t('programs.form.cycleDays')}
          name="cycleDays"
          inputMode="numeric"
          className="w-24"
          value={value}
          error={error ?? undefined}
          onChange={(event) => setValue(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          {t('programs.editor.changeCycle')}
        </Button>
      </form>
      <p className="text-muted text-sm">
        {isWeekly(block)
          ? t('programs.editor.weeklyDescription')
          : t('programs.list.cycle', { count: block.cycleDays })}
      </p>
      {pending !== null ? (
        <div className="bg-background/50 border-border flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-sm">
            {t('programs.editor.shortenConfirm', {
              days: pending.lost.map(label).join(', '),
              count: pending.lost.length,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                onChange({ type: 'setCycleDays', cycleDays: pending.cycleDays });
                setPending(null);
              }}
            >
              {t('programs.editor.shortenYes')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPending(null);
                setValue(String(block.cycleDays));
              }}
            >
              {t('programs.form.cancel')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
