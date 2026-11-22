import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Input, segmentClassName, SEGMENTED_GROUP_CLASS } from '@/core/ui';

import { dayCounts } from '../model/cycle-editor';
import type { CycleEditorAction } from '../model/cycle-editor';
import type { ProgramBlock, ProgramDay } from '../model/program-document';
import { DayCopyActions } from './DayCopyActions';
import { DayExercises } from './DayExercises';

const KINDS: readonly ProgramDay['kind'][] = ['training', 'rest'];

interface DayPanelProps {
  block: ProgramBlock;
  day: ProgramDay;
  label: string;
  onChange: (action: CycleEditorAction) => void;
}

/**
 * Un día del ciclo: de entreno o de descanso y, si es de entreno, su nombre,
 * subtítulo y lugar (D-075), y sus ejercicios (PR 2.9).
 */
export function DayPanel({ block, day, label, onChange }: DayPanelProps) {
  const { t } = useTranslation();
  const [isConfirmingRest, setIsConfirmingRest] = useState(false);
  const counts = dayCounts(day);

  const setKind = (kind: ProgramDay['kind']) => {
    // Un día de descanso no lleva ejercicios: si tiene, se pregunta antes.
    if (kind === 'rest' && counts.exercises > 0) {
      setIsConfirmingRest(true);
      return;
    }
    onChange({ type: 'setDayKind', dayNumber: day.dayNumber, kind });
  };
  const text = (field: 'name' | 'subtitle' | 'place', value: string) =>
    onChange({ type: 'setDayText', dayNumber: day.dayNumber, field, value });

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{label}</h2>
      <div
        role="group"
        aria-label={t('programs.editor.kindLabel')}
        className={SEGMENTED_GROUP_CLASS}
      >
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={day.kind === kind}
            onClick={() => setKind(kind)}
            className={segmentClassName(day.kind === kind)}
          >
            {t(`programs.editor.kinds.${kind}`)}
          </button>
        ))}
      </div>

      {isConfirmingRest ? (
        <div className="bg-background/50 border-border flex flex-col gap-3 rounded-2xl border p-4">
          <p className="text-sm">{t('programs.editor.restConfirm', { count: counts.exercises })}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setIsConfirmingRest(false);
                onChange({ type: 'setDayKind', dayNumber: day.dayNumber, kind: 'rest' });
              }}
            >
              {t('programs.editor.restYes')}
            </Button>
            <Button variant="ghost" onClick={() => setIsConfirmingRest(false)}>
              {t('programs.form.cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      {day.kind === 'training' ? (
        <>
          <Input
            label={t('programs.editor.dayName')}
            name="dayName"
            maxLength={40}
            value={day.name ?? ''}
            onChange={(event) => text('name', event.target.value)}
          />
          <Input
            label={t('programs.editor.subtitle')}
            name="subtitle"
            maxLength={60}
            hint={t('programs.editor.subtitleHint')}
            value={day.subtitle ?? ''}
            onChange={(event) => text('subtitle', event.target.value)}
          />
          <Input
            label={t('programs.editor.place')}
            name="place"
            maxLength={20}
            hint={t('programs.editor.placeHint')}
            value={day.place ?? ''}
            onChange={(event) => text('place', event.target.value)}
          />
          <DayExercises day={day} onChange={onChange} />
        </>
      ) : (
        <p className="text-muted text-sm">{t('programs.editor.restDescription')}</p>
      )}
      <DayCopyActions block={block} day={day} onChange={onChange} />
    </div>
  );
}
