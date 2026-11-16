import type { Profile } from '../tenancy';

import type {
  ClientProfileTab,
  HomeCard,
  ModuleManifest,
  ModuleNavItem,
  ModuleRoute,
} from './module-manifest';

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

/** Pestañas que aportan los módulos a la ficha de un cliente. */
export function collectClientProfileTabs(modules: readonly ModuleManifest[]): ClientProfileTab[] {
  return modules.flatMap((module) => module.clientProfileTabs);
}

/** Tarjetas que aportan los módulos al inicio de un perfil, ya ordenadas. */
export function collectHomeCards(modules: readonly ModuleManifest[], profile: Profile): HomeCard[] {
  return modules.flatMap((module) => module.homeCards[profile]).sort((a, b) => a.order - b.order);
}
