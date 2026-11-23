import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import { LanguageSwitcher } from '@/core/i18n';
import { ClientProfileTabsProvider, collectClientProfileTabs } from '@/core/modules';

import { BrandMark } from '../BrandMark';
import { ShellDock } from '../ShellDock';
import { ShellNavLink } from '../ShellNavLink';
import { useActiveModules } from '../useActiveModules';
import { useShellNav } from '../useShellNav';

/**
 * Carcasa del perfil COACH (ARQUITECTURA §7): en escritorio, un menú lateral de
 * cristal que flota separado de los bordes; en el móvil, la marca arriba y la
 * barra flotante abajo (D-prime1-6). El menú y las pestañas de la ficha de un
 * cliente salen de los manifests de los módulos activos.
 */
export function CoachLayout() {
  const { t } = useTranslation();
  const items = useShellNav('coach');
  const modules = useActiveModules();
  const tabs = useMemo(() => collectClientProfileTabs(modules), [modules]);

  return (
    <div className="relative flex flex-1 flex-col">
      <aside className="glass-float fixed inset-y-3 left-3 z-30 hidden w-64 flex-col gap-8 rounded-[2rem] p-4 pt-6 md:flex">
        <div className="px-2">
          <BrandMark />
        </div>
        <nav aria-label={t('app.nav.label')} className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <ShellNavLink key={item.to} item={item} layout="side" />
          ))}
        </nav>
        <LanguageSwitcher />
      </aside>

      <header className="relative z-10 flex items-center px-5 pt-[calc(var(--safe-top)+1rem)] md:hidden">
        <BrandMark variant="chip" />
      </header>
      {/* En el móvil, deja sitio a la barra flotante y a la de gestos. */}
      {/* En escritorio, el contenido se centra en lo que deja libre el menú. */}
      <main className="relative w-full flex-1 pt-8 pb-[var(--dock-space)] md:pt-12 md:pb-16 md:pl-[16.75rem]">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-10">
          <ClientProfileTabsProvider tabs={tabs}>
            <Outlet />
          </ClientProfileTabsProvider>
        </div>
      </main>

      <ShellDock items={items} className="md:hidden" />
    </div>
  );
}
