import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/core/lib';
import { Icon } from '@/core/ui';

import type { ShellNavItem } from './useShellNav';

interface ShellNavLinkProps {
  item: ShellNavItem;
  /** `side`: menú lateral (escritorio). `dock`: barra flotante (móvil). */
  layout: 'side' | 'dock';
}

const LAYOUTS: Record<ShellNavLinkProps['layout'], string> = {
  side: 'min-h-12 gap-3 rounded-2xl px-4 text-[0.9375rem]',
  dock: 'relative z-10 min-h-14 min-w-0 flex-1 flex-col justify-center gap-1 rounded-full text-[0.6875rem] tracking-[0.01em]',
};

export function ShellNavLink({ item, layout }: ShellNavLinkProps) {
  const { t } = useTranslation();

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'focus-ring flex items-center font-medium transition-[color,background-color] duration-300',
          LAYOUTS[layout],
          isActive ? 'text-foreground' : 'text-muted hover:text-foreground',
          isActive && layout === 'side' && 'bg-glass-strong shadow-[var(--glass-edge)]',
          !isActive && layout === 'side' && 'hover:bg-glass',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            name={item.icon}
            className={cn(
              'size-[1.35rem] shrink-0 transition-[color,transform] duration-300',
              isActive && 'text-primary-readable',
              isActive && layout === 'dock' && '-translate-y-px scale-110',
            )}
          />
          <span className={cn('truncate', layout === 'dock' && 'max-w-full px-1')}>
            {t(item.labelKey)}
          </span>
          {isActive && layout === 'side' ? (
            <span
              aria-hidden="true"
              className="bg-primary ml-auto size-1.5 rounded-full shadow-[0_0_12px_2px_var(--color-primary-glow)]"
            />
          ) : null}
        </>
      )}
    </NavLink>
  );
}
