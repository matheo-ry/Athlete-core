import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/core/lib';

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Campo de texto de varias líneas con su etiqueta, con el aspecto de `Input`. `core/ui` no tiene uno. */
export function TextArea({ label, hint, error, className, ...rest }: TextAreaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'bg-surface text-foreground min-h-28 rounded-lg border px-3 py-2 text-base',
          'focus-visible:outline-primary-readable focus-visible:outline-2 focus-visible:outline-offset-2',
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
