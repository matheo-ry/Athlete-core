import type { Profile } from '../tenancy';

import type { ModuleManifest, ModuleNavItem, ModuleRoute } from './module-manifest';

/** Rutas que aportan los módulos a la zona de un perfil. */
export function collectRoutes(modules: readonly ModuleManifest[], profile: Profile): ModuleRoute[] {
  return modules.flatMap((module) => module.routes[profile]);
}

/** Entradas de menú que aportan los módulos a un perfil, ya ordenadas. */
export function collectNavItems(
  modules: readonly ModuleManifest[],
  profile: Profile,
): ModuleNavItem[] {
  return modules.flatMap((module) => module.nav[profile]).sort((a, b) => a.order - b.order);
}
