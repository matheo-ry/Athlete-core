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
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="accent-primary focus-visible:outline-primary-readable mt-0.5 size-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2"
          {...rest}
        />
        <label htmlFor={id} className="text-foreground text-sm">
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
