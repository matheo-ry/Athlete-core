import { useId } from 'react';

import { cn } from '@/core/lib';

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
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-foreground text-sm font-medium">
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
        className={cn(
          'bg-surface text-foreground border-border min-h-11 w-full rounded-lg border px-3 text-base',
          'focus-visible:outline-primary-readable focus-visible:outline-2 focus-visible:outline-offset-2',
        )}
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
