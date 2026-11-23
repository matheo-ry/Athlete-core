import { useTranslation } from 'react-i18next';
import { matchPath, useLocation } from 'react-router';

import { cn } from '@/core/lib';

import { ShellNavLink } from './ShellNavLink';
import type { ShellNavItem } from './useShellNav';

interface ShellDockProps {
  items: readonly ShellNavItem[];
  className?: string;
}

/**
 * La barra de navegación flotante (D-prime1-6): una cápsula de cristal sobre el
 * contenido, separada del borde. Una lente de luz se desliza con un muelle
 * hasta la pestaña activa. Las pestañas son del mismo ancho, así la posición de
 * la lente sale del índice, sin medir nada.
 */
export function ShellDock({ items, className }: ShellDockProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const active = items.findIndex(
    (item) => matchPath({ path: item.to, end: item.end ?? false }, pathname) !== null,
  );

  return (
    <nav
      aria-label={t('app.nav.label')}
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3',
        'pb-[calc(0.75rem+var(--safe-bottom))]',
        className,
      )}
    >
      <div className="glass-float pointer-events-auto relative flex w-full max-w-md rounded-full p-1.5">
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-1.5 left-1.5 rounded-full transition-[transform,opacity] duration-700 ease-[var(--ease-spring)]',
            'bg-glass-strong light:bg-white shadow-[var(--glass-edge),0_8px_24px_-12px_var(--color-primary-glow)]',
            active === -1 && 'opacity-0',
          )}
          style={{
            width: `calc((100% - 0.75rem) / ${String(items.length)})`,
            transform: `translateX(${String(Math.max(active, 0) * 100)}%)`,
          }}
        />
        {items.map((item) => (
          <ShellNavLink key={item.to} item={item} layout="dock" />
        ))}
      </div>
    </nav>
  );
}
