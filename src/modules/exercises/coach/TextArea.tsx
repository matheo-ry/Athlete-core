import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/core/lib';
import { FIELD_LABEL_CLASS, fieldClassName } from '@/core/ui';

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
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={fieldClassName(Boolean(error), cn('min-h-28 py-3', className))}
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
