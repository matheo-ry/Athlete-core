import type { FeatureFlags } from '@/core/flags';
import type { ModuleManifest } from '@/core/modules';

/**
 * Los módulos que se montan para el tenant actual: los que tienen su flag activo
 * (ARQUITECTURA §9) y, solo en desarrollo, los de ejemplo, que no tienen flag
 * en la base de datos.
 */
export function filterActiveModules(
  modules: readonly ModuleManifest[],
  flags: FeatureFlags,
  developmentKeys: ReadonlySet<string>,
): ModuleManifest[] {
  return modules.filter((module) => developmentKeys.has(module.key) || flags.isEnabled(module.key));
}
