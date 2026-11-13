import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '../lib';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Obligatoria: todo campo lleva su etiqueta (AGENTS.md §4, accesibilidad). */
  label: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, ...rest }: InputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'bg-surface text-foreground min-h-11 rounded-lg border px-3 text-base',
          'placeholder:text-muted focus-visible:outline-primary-readable',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          error ? 'border-danger' : 'border-border',
          className,
        )}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="text-muted text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
