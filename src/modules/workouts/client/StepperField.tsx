import { Minus, Plus } from 'lucide-react';
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

const KEY =
  'focus-ring flex size-11 shrink-0 items-center justify-center rounded-[0.9rem] text-foreground ' +
  'transition-[background-color,transform] duration-150 hover:bg-glass-strong active:scale-90 active:bg-glass-hover';

/**
 * Un dato de una serie (D-120): una tecla de cristal con − y + grandes (44 px)
 * y la cifra en medio; al tocar la cifra, el teclado del móvil. Con la serie
 * hecha, la tecla se tiñe del color del coach (D-prime2-4).
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
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="eyebrow text-muted truncate px-1">{label}</span>
      <div className="bg-glass group-data-[done=true]:bg-primary-soft flex h-14 items-center gap-0.5 rounded-[1.15rem] p-1.5 shadow-[inset_0_0_0_1px_var(--color-hairline)] transition-colors duration-300">
        <button
          type="button"
          className={KEY}
          aria-label={t('workouts.set.decrease', { field: label })}
          onClick={() => {
            bump(-1);
          }}
        >
          <Minus aria-hidden="true" className="size-5" strokeWidth={2.4} />
        </button>
        <input
          aria-label={label}
          inputMode={decimals ? 'decimal' : 'numeric'}
          className="numeral placeholder:text-muted/55 h-full w-full min-w-0 flex-1 bg-transparent text-center text-[1.6rem] outline-none"
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
          className={KEY}
          aria-label={t('workouts.set.increase', { field: label })}
          onClick={() => {
            bump(1);
          }}
        >
          <Plus aria-hidden="true" className="size-5" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
