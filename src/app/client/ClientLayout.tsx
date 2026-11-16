import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import { LanguageSwitcher } from '@/core/i18n';

import { BrandMark } from '../BrandMark';
import { ShellNavLink } from '../ShellNavLink';
import { useShellNav } from '../useShellNav';

/**
 * Carcasa del perfil CLIENTE: pensada para móvil y para usarse en mitad de un
 * entreno. Barra inferior siempre, contenido en una columna (ARQUITECTURA §7).
 */
export function ClientLayout() {
  const { t } = useTranslation();
  const items = useShellNav('client');

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border bg-surface flex items-center justify-between gap-2 border-b px-4 py-2">
        <BrandMark />
        <LanguageSwitcher />
      </header>
      {/* Deja sitio a la barra inferior fija y a la de gestos del móvil. */}
      <main className="mx-auto w-full max-w-xl flex-1 p-4 pb-[calc(5rem+var(--safe-bottom))]">
        <Outlet />
      </main>
      <nav
        aria-label={t('app.nav.label')}
        className="border-border bg-surface fixed inset-x-0 bottom-0 flex border-t pb-[var(--safe-bottom)]"
      >
        {items.map((item) => (
          <ShellNavLink key={item.to} item={item} layout="bottom" />
        ))}
      </nav>
    </div>
  );
}
