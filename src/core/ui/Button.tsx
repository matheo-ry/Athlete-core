import type { ButtonHTMLAttributes } from 'react';

import { buttonClassName } from './button-styles';
import type { ButtonVariant } from './button-styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...rest} />;
}
