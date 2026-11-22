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
        {/* La casilla nativa sigue ahí (teclado, lector de pantalla); solo se
            repinta, y el tick es un icono encima que aparece al marcarla. */}
        <span className="relative mt-0.5 flex size-6 shrink-0">
          <input
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="peer border-border-strong bg-background checked:border-primary checked:bg-primary focus-ring size-6 cursor-pointer appearance-none rounded-lg border transition-colors duration-200"
            {...rest}
          />
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="text-on-primary pointer-events-none absolute inset-1 size-4 scale-50 opacity-0 transition-[opacity,transform] duration-200 peer-checked:scale-100 peer-checked:opacity-100"
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
