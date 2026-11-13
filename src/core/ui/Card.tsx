import type { HTMLAttributes } from 'react';

import { cn } from '../lib';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-border bg-surface text-foreground rounded-xl border p-4', className)}
      {...rest}
    />
  );
}
