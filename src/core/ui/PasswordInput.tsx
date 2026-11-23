import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { FIELD_LABEL_CLASS, fieldClassName } from './field-styles';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string;
  hint?: string;
  error?: string;
}

/**
 * Campo de contraseña con un botón para ver lo escrito. Por eso no hace falta un
 * campo de "repetir contraseña" (DECISIONES D-041).
 */
export function PasswordInput({ label, hint, error, className, ...rest }: PasswordInputProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  const toggleLabel = isVisible ? t('core.ui.hidePassword') : t('core.ui.showPassword');

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={fieldClassName(Boolean(error), `pr-12 ${className ?? ''}`)}
          {...rest}
        />
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          className="text-muted hover:text-foreground focus-ring absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl transition-colors"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
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
