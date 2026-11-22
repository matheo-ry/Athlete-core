import type { ButtonHTMLAttributes } from 'react';

import { buttonClassName } from './button-styles';
import type { ButtonSize, ButtonVariant } from './button-styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** `lg`: la acción principal de una pantalla (56 px de alto). */
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className, size)} {...rest} />;
}
