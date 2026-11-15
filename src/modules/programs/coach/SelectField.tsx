import { useId } from 'react';

import { cn } from '@/core/lib';

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Desplegable nativo con su etiqueta, con el aspecto de `Input`. Nativo para
 * que en el móvil abra la lista del propio sistema. `core/ui` no tiene uno
 * (apuntado en "Ideas y deuda").
 */
export function SelectField({ label, value, options, onChange, className }: SelectFieldProps) {
  const id = useId();

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-surface text-foreground border-border focus-visible:outline-primary-readable min-h-11 rounded-lg border px-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
