import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';
import { Icon } from '@/core/ui';

import { stepValue } from '../model/active-workout';

interface StepperFieldProps {
  label: string;
  value: number | null;
  /** Lo que se enseña si aún no hay nada apuntado: la vez anterior o lo prescrito. */
  placeholder: number | null;
  step: number;
  max: number;
  decimals: boolean;
  onChange: (value: number) => void;
  className?: string;
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

const STEP_BUTTON =
  'focus-ring text-muted hover:text-foreground hover:bg-foreground/8 flex size-11 shrink-0 ' +
  'items-center justify-center rounded-xl transition-[transform,background-color] active:scale-90';

/**
 * Un dato de una serie (D-120): una baldosa con su etiqueta, − y + de 44 px y,
 * en medio, la cifra grande; al tocarla, el teclado del móvil. Lo de referencia
 * se ve atenuado hasta que se apunta algo.
 */
export function StepperField(props: StepperFieldProps) {
  const { t } = useTranslation();
  const { label, value, placeholder, step, max, decimals, onChange, className } = props;
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
    <div
      className={cn(
        'bg-background/70 border-border flex min-w-0 flex-col gap-0.5 rounded-2xl border p-1',
        className,
      )}
    >
      <span className="eyebrow truncate px-2 pt-1.5">{label}</span>
      <div className="flex items-center">
        <button
          type="button"
          className={STEP_BUTTON}
          aria-label={t('workouts.set.decrease', { field: label })}
          onClick={() => {
            bump(-1);
          }}
        >
          <Icon name="minus" className="size-5" />
        </button>
        <input
          aria-label={label}
          inputMode={decimals ? 'decimal' : 'numeric'}
          className="numeric text-foreground placeholder:text-muted/45 h-11 w-full min-w-0 flex-1 rounded-lg bg-transparent text-center text-2xl font-medium outline-none focus-visible:bg-foreground/5"
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
          className={STEP_BUTTON}
          aria-label={t('workouts.set.increase', { field: label })}
          onClick={() => {
            bump(1);
          }}
        >
          <Icon name="plus" className="size-5" />
        </button>
      </div>
    </div>
  );
}
