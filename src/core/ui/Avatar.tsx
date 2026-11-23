import { cn } from '../lib';

import { initialsOf } from './initials';

interface AvatarProps {
  /** El nombre de la persona: de él salen las iniciales. */
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-20 text-2xl',
};

/**
 * Las iniciales de una persona en un círculo de cristal con un filo del color
 * del coach. Decorativo: el nombre va siempre al lado.
 */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-glass-strong text-foreground flex shrink-0 items-center justify-center rounded-full font-semibold',
        'shadow-[inset_0_0_0_1px_var(--color-hairline),inset_0_-8px_16px_-10px_var(--color-primary-glow)]',
        'font-[family-name:var(--font-display)] [font-stretch:110%]',
        SIZES[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
