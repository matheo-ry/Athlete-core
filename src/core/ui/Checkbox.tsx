import { Check } from 'lucide-react';
import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  /** Puede llevar enlaces (por ejemplo, a los términos). */
  label: ReactNode;
  error?: string;
}

/** Casilla con su etiqueta. Toda la fila se puede pulsar (44 px de alto como mínimo). */
export function Checkbox({ label, error, ...rest }: CheckboxProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-11 items-start gap-3">
        <span className="relative mt-0.5 flex size-6 shrink-0">
          <input
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="peer bg-glass-strong checked:bg-primary focus-ring size-6 cursor-pointer appearance-none rounded-lg shadow-[inset_0_0_0_1px_var(--color-hairline-strong)] transition-colors checked:shadow-[0_6px_18px_-6px_var(--color-primary-glow)]"
            {...rest}
          />
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="text-on-primary pointer-events-none absolute inset-1 size-4 scale-50 opacity-0 transition-[transform,opacity] duration-200 peer-checked:scale-100 peer-checked:opacity-100"
          />
        </span>
        <label htmlFor={id} className="text-foreground text-sm leading-6">
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
