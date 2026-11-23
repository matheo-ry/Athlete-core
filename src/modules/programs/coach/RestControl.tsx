import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';

import { formatRest } from '../model/prescription';
import { SelectField } from './SelectField';

const SHORTCUTS = [60, 90, 120, 180] as const;
const MINUTES = Array.from({ length: 11 }, (_, index) => index);
const SECONDS = [0, 15, 30, 45];

interface RestControlProps {
  /** El nombre del ejercicio, para los lectores de pantalla. */
  name: string;
  seconds: number | null;
  onChange: (seconds: number | null) => void;
}

/** El descanso entre series: atajos (1:00, 1:30, 2:00, 3:00) y minutos y segundos (PR 2.10). */
export function RestControl({ name, seconds, onChange }: RestControlProps) {
  const { t } = useTranslation();
  const minutes = seconds === null ? null : Math.floor(seconds / 60);
  const rest = seconds === null ? 0 : seconds % 60;
  // Un valor que no está en las listas (viene de otro sitio) se añade para no perderlo.
  const minuteOptions =
    minutes === null || MINUTES.includes(minutes) ? MINUTES : [...MINUTES, minutes];
  const secondOptions = SECONDS.includes(rest) ? SECONDS : [...SECONDS, rest].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <SelectField
          label={t('programs.prescription.restMinutes')}
          value={minutes === null ? '' : String(minutes)}
          options={[
            { value: '', label: t('programs.prescription.none') },
            ...minuteOptions.map((value) => ({ value: String(value), label: String(value) })),
          ]}
          onChange={(value) => onChange(value === '' ? null : Number(value) * 60 + rest)}
        />
        <SelectField
          label={t('programs.prescription.restSeconds')}
          value={String(rest)}
          options={secondOptions.map((value) => ({
            value: String(value),
            label: String(value).padStart(2, '0'),
          }))}
          onChange={(value) => onChange((minutes ?? 0) * 60 + Number(value))}
        />
        <div
          role="group"
          aria-label={t('programs.prescription.restShortcuts', { name })}
          className="flex flex-wrap gap-1"
        >
          {SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut}
              type="button"
              aria-pressed={seconds === shortcut}
              onClick={() => onChange(shortcut)}
              className={cn(
                'min-h-11 rounded-xl px-3 text-sm font-medium tabular-nums',
                'focus-ring',
                seconds === shortcut
                  ? 'bg-primary text-on-primary'
                  : 'bg-background text-foreground',
              )}
            >
              {formatRest(shortcut)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
