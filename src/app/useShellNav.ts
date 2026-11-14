import { useMemo } from 'react';

import { collectNavItems } from '@/core/modules';
import type { ModuleNavItem } from '@/core/modules';
import type { Profile } from '@/core/tenancy';

import { useActiveModules } from './useActiveModules';

export interface ShellNavItem extends ModuleNavItem {
  /** `true` para que el enlace solo se marque activo en su ruta exacta. */
  end?: boolean;
}

// La entrada de inicio la pone la carcasa. El resto del menú lo aportan los
// módulos activos a través de su manifest.
const HOME_ITEMS: Record<Profile, ShellNavItem> = {
  coach: { to: '/coach', labelKey: 'app.nav.coachHome', icon: 'home', order: 0, end: true },
  client: { to: '/client', labelKey: 'app.nav.clientHome', icon: 'calendar', order: 0, end: true },
};

// Las entradas fijas del final del menú: los ajustes, que no son un módulo.
const END_ITEMS: Record<Profile, readonly ShellNavItem[]> = {
  coach: [
    { to: '/coach/settings', labelKey: 'app.nav.coachSettings', icon: 'settings', order: 1000 },
  ],
  client: [],
};

export function useShellNav(profile: Profile): ShellNavItem[] {
  const modules = useActiveModules();
  return useMemo(
    () => [HOME_ITEMS[profile], ...collectNavItems(modules, profile), ...END_ITEMS[profile]],
    [modules, profile],
  );
}
