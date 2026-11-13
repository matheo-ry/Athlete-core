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

export function useShellNav(profile: Profile): ShellNavItem[] {
  const modules = useActiveModules();
  return useMemo(
    () => [HOME_ITEMS[profile], ...collectNavItems(modules, profile)],
    [modules, profile],
  );
}
