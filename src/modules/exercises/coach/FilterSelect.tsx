import { useId } from 'react';

import { cn } from '@/core/lib';
import { FIELD_LABEL_CLASS, fieldClassName } from '@/core/ui';

interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Desplegable nativo con su etiqueta, con el aspecto de `Input`. Nativo para
 * que en el móvil abra la lista del propio sistema. `core/ui` no tiene uno.
 */
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps<T>) {
  const id = useId();

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const chosen = options.find((option) => option.value === event.target.value);
          if (chosen !== undefined) {
            onChange(chosen.value);
          }
        }}
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
