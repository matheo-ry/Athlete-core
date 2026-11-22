import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/core/lib';
import { Icon } from '@/core/ui';

import type { ShellNavItem } from './useShellNav';

interface ShellNavLinkProps {
  item: ShellNavItem;
  /** `side`: menú lateral (escritorio). `bottom`: barra inferior flotante (móvil). */
  layout: 'side' | 'bottom';
}

// Resorte con poco rebote: el indicador "aterriza" sin bailar.
const SPRING = { type: 'spring', stiffness: 520, damping: 38, mass: 0.9 } as const;

export function ShellNavLink({ item, layout }: ShellNavLinkProps) {
  const { t } = useTranslation();
  const label = t(item.labelKey);
  const isBottom = layout === 'bottom';

  return (
    // `layout` hace que, al abrirse la etiqueta de la pestaña activa, las demás
    // se aparten deslizándose en vez de saltar.
    <motion.div layout transition={SPRING} className={cn(isBottom ? 'flex-none' : 'w-full')}>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            'focus-ring relative flex items-center rounded-full font-medium transition-colors',
            isBottom ? 'h-11 px-3 text-sm' : 'min-h-11 gap-3 rounded-xl px-3 text-sm',
            isActive ? 'text-primary-readable' : 'text-muted hover:text-foreground',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <motion.span
                layoutId={isBottom ? 'nav-pill-bottom' : 'nav-pill-side'}
                transition={SPRING}
                aria-hidden="true"
                className={cn(
                  'bg-primary-soft ring-primary/30 absolute inset-0 ring-1',
                  isBottom ? 'rounded-full' : 'rounded-xl',
                )}
              />
            ) : null}
            <Icon name={item.icon} className="relative size-5 shrink-0" />
            {isBottom && !isActive ? (
              // Sin etiqueta a la vista, pero el enlace conserva su nombre accesible.
              <span className="sr-only">{label}</span>
            ) : (
              <motion.span
                initial={isBottom ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className={cn('relative whitespace-nowrap', isBottom && 'ml-2 font-semibold')}
              >
                {label}
              </motion.span>
            )}
          </>
        )}
      </NavLink>
    </motion.div>
  );
}
