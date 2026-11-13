import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/core/lib';
import { Icon } from '@/core/ui';

import type { ShellNavItem } from './useShellNav';

interface ShellNavLinkProps {
  item: ShellNavItem;
  /** `side`: menú lateral (escritorio). `bottom`: barra inferior (móvil). */
  layout: 'side' | 'bottom';
}

const LAYOUTS: Record<ShellNavLinkProps['layout'], string> = {
  side: 'min-h-11 gap-3 rounded-lg px-3 text-sm',
  bottom: 'min-h-14 flex-1 flex-col justify-center gap-1 text-xs',
};

export function ShellNavLink({ item, layout }: ShellNavLinkProps) {
  const { t } = useTranslation();

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center font-medium transition-colors',
          'focus-visible:outline-primary-readable focus-visible:outline-2 focus-visible:-outline-offset-2',
          LAYOUTS[layout],
          isActive ? 'text-primary-readable' : 'text-muted hover:text-foreground',
          isActive && layout === 'side' && 'bg-background',
        )
      }
    >
      <Icon name={item.icon} />
      <span>{t(item.labelKey)}</span>
    </NavLink>
  );
}
