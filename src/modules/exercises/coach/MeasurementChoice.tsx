import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { MEASUREMENTS } from '../model/exercise-schema';
import type { Measurement } from '../model/exercise-schema';

interface MeasurementChoiceProps {
  value: Measurement | '';
  onChange: (value: Measurement) => void;
  error?: string;
  /** No se puede cambiar: el ejercicio ya está en una rutina (D-072). */
  disabled?: boolean;
}

/** Las 4 formas de medir (D-072), cada una con su ejemplo. Obligatoria. */
export function MeasurementChoice({ value, onChange, error, disabled }: MeasurementChoiceProps) {
  const { t } = useTranslation();
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <fieldset
      disabled={disabled}
      className="flex flex-col gap-2 disabled:opacity-60"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="text-foreground mb-1.5 text-sm font-medium">
        {t('exercises.form.measurement')}
      </legend>
      {MEASUREMENTS.map((option) => (
        <label
          key={option}
          className="border-border flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2"
        >
          <input
            type="radio"
            name={`${id}-measurement`}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-primary mt-1 size-4 shrink-0"
          />
          <span className="flex flex-col">
            <span className="text-sm font-medium">{t(`exercises.measurements.${option}`)}</span>
            <span className="text-muted text-sm">
              {t(`exercises.form.measurementExamples.${option}`)}
            </span>
          </span>
        </label>
      ))}
      {error ? (
        <p id={errorId} className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
