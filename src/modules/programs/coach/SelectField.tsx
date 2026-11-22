import { useId } from 'react';

import { cn } from '@/core/lib';
import { FIELD_LABEL_CLASS, fieldClassName } from '@/core/ui';

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
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName(false)}
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
