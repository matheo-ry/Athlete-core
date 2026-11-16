import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import { LanguageSwitcher } from '@/core/i18n';
import { ClientProfileTabsProvider, collectClientProfileTabs } from '@/core/modules';

import { BrandMark } from '../BrandMark';
import { ShellNavLink } from '../ShellNavLink';
import { useActiveModules } from '../useActiveModules';
import { useShellNav } from '../useShellNav';

/**
 * Carcasa del perfil COACH: menú lateral en escritorio y barra inferior en móvil
 * (ARQUITECTURA §7). El menú y las pestañas de la ficha de un cliente salen de
 * los manifests de los módulos activos.
 */
export function CoachLayout() {
  const { t } = useTranslation();
  const items = useShellNav('coach');
  const modules = useActiveModules();
  const tabs = useMemo(() => collectClientProfileTabs(modules), [modules]);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-border bg-surface hidden w-60 shrink-0 flex-col gap-6 border-r p-4 md:sticky md:top-0 md:flex md:h-dvh md:self-start md:overflow-y-auto">
        <BrandMark />
        <nav aria-label={t('app.nav.label')} className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <ShellNavLink key={item.to} item={item} layout="side" />
          ))}
        </nav>
        <LanguageSwitcher />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-surface flex items-center justify-between gap-2 border-b px-4 py-2 md:hidden">
          <BrandMark />
          <LanguageSwitcher />
        </header>
        {/* En el móvil, deja sitio a la barra inferior fija y a la de gestos. */}
        <main className="flex-1 p-4 pb-[calc(5rem+var(--safe-bottom))] md:p-8">
          <ClientProfileTabsProvider tabs={tabs}>
            <Outlet />
          </ClientProfileTabsProvider>
        </main>
      </div>

      <nav
        aria-label={t('app.nav.label')}
        className="border-border bg-surface fixed inset-x-0 bottom-0 flex border-t pb-[var(--safe-bottom)] md:hidden"
      >
        {items.map((item) => (
          <ShellNavLink key={item.to} item={item} layout="bottom" />
        ))}
      </nav>
    </div>
  );
}
