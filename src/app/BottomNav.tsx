import { useTranslation } from 'react-i18next';

import { cn } from '@/core/lib';

import { ShellNavLink } from './ShellNavLink';
import type { ShellNavItem } from './useShellNav';

interface BottomNavProps {
  items: readonly ShellNavItem[];
  /** Clases extra, por ejemplo `md:hidden` en la carcasa del coach. */
  className?: string;
}

/**
 * Barra de navegación del móvil: una píldora de vidrio que flota sobre el
 * contenido, con el pulgar a mano. La pestaña activa se abre con su nombre.
 */
export function BottomNav({ items, className }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('app.nav.label')}
      className={cn(
        // El contenedor deja pasar los toques; solo la píldora los recibe.
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3',
        'pb-[calc(0.75rem+var(--safe-bottom))]',
        className,
      )}
    >
      <div className="glass pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full p-1.5">
        {items.map((item) => (
          <ShellNavLink key={item.to} item={item} layout="bottom" />
        ))}
      </div>
    </nav>
  );
}
