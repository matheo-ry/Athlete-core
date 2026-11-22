import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PROGRAM_MODES } from '../model/assignments';
import type { ProgramMode } from '../model/assignments';

interface ModeChoiceProps {
  value: ProgramMode;
  onChange: (mode: ProgramMode) => void;
}

/** "Con calendario" o "Lista", para ese cliente (D-082). */
export function ModeChoice({ value, onChange }: ModeChoiceProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground mb-1.5 text-sm font-medium">
        {t('programs.assign.mode')}
      </legend>
      {PROGRAM_MODES.map((option) => (
        <label
          key={option}
          className="border-border flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2"
        >
          <input
            type="radio"
            name={`${id}-mode`}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-primary mt-1 size-4 shrink-0"
          />
          <span className="flex flex-col">
            <span className="text-sm font-medium">{t(`programs.assign.modes.${option}`)}</span>
            <span className="text-muted text-sm">{t(`programs.assign.modeHints.${option}`)}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
