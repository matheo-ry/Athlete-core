import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router';

import { LanguageSwitcher } from '@/core/i18n';
import { ClientProfileTabsProvider, collectClientProfileTabs } from '@/core/modules';

import { BottomNav } from '../BottomNav';
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
  const { pathname } = useLocation();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-border bg-surface/60 hidden w-64 shrink-0 flex-col gap-8 border-r p-5 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-dvh md:self-start md:overflow-y-auto">
        <BrandMark />
        <nav aria-label={t('app.nav.label')} className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <ShellNavLink key={item.to} item={item} layout="side" />
          ))}
        </nav>
        <div className="self-start">
          <LanguageSwitcher />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 px-5 pt-4 md:hidden">
          <BrandMark />
          <LanguageSwitcher />
        </header>
        {/* En el móvil, deja sitio a la barra inferior flotante y a la de gestos. */}
        <main className="flex-1 px-5 pt-5 pb-[calc(6.5rem+var(--safe-bottom))] md:p-10">
          <ClientProfileTabsProvider tabs={tabs}>
            <div key={pathname} className="animate-rise">
              <Outlet />
            </div>
          </ClientProfileTabsProvider>
        </main>
      </div>

      <BottomNav items={items} className="md:hidden" />
    </div>
  );
}
