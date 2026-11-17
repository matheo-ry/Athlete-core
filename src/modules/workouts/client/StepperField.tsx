import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { stepValue } from '../model/active-workout';

interface StepperFieldProps {
  label: string;
  value: number | null;
  /** Lo que se enseña si aún no hay nada apuntado: lo prescrito (y, en el PR 3.5b, la vez anterior). */
  placeholder: number | null;
  step: number;
  max: number;
  decimals: boolean;
  onChange: (value: number) => void;
}

/** Lo que se escribe con el teclado: coma o punto, según la costumbre de cada uno. */
function parseNumber(text: string, decimals: boolean): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '' || !/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return decimals ? value : Math.round(value);
}

/**
 * Un dato de una serie (D-120): − y + grandes (44 px o más) y, al tocar el
 * número, el teclado del móvil.
 */
export function StepperField(props: StepperFieldProps) {
  const { t } = useTranslation();
  const { label, value, placeholder, step, max, decimals, onChange } = props;
  // Lo que se está escribiendo; vacío mientras no se escribe (manda `value`).
  const [draft, setDraft] = useState<string | null>(null);
  const base = value ?? placeholder ?? 0;
  const bump = (direction: 1 | -1) => {
    // Sin nada apuntado, el primer toque deja lo de referencia tal cual si existe.
    onChange(
      value === null && placeholder !== null ? placeholder : stepValue(base, step, direction, max),
    );
  };
  const commit = (text: string) => {
    const parsed = parseNumber(text, decimals);
    if (parsed !== null && parsed <= max && parsed !== value) {
      onChange(parsed);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-muted text-xs">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="border-border bg-surface h-11 w-11 rounded-lg border text-xl font-semibold"
          aria-label={t('workouts.set.decrease', { field: label })}
          onClick={() => {
            bump(-1);
          }}
        >
          −
        </button>
        <input
          aria-label={label}
          inputMode={decimals ? 'decimal' : 'numeric'}
          className="border-border bg-background h-11 w-16 rounded-lg border text-center text-lg font-semibold"
          value={draft ?? (value === null ? '' : String(value))}
          placeholder={placeholder === null ? '' : String(placeholder)}
          onFocus={(event) => {
            event.target.select();
          }}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onBlur={(event) => {
            commit(event.target.value);
            setDraft(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
        />
        <button
          type="button"
          className="border-border bg-surface h-11 w-11 rounded-lg border text-xl font-semibold"
          aria-label={t('workouts.set.increase', { field: label })}
          onClick={() => {
            bump(1);
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
