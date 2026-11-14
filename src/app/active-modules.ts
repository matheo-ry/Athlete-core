import type { FeatureFlags } from '@/core/flags';
import type { ModuleManifest } from '@/core/modules';

/**
 * Los módulos que se montan para el tenant actual: los que tienen su flag activo
 * (ARQUITECTURA §9) y, solo en desarrollo, los de ejemplo, que no tienen flag
 * en la base de datos.
 */
export function filterActiveModules<T extends Pick<ModuleManifest, 'key'>>(
  modules: readonly T[],
  flags: Pick<FeatureFlags, 'isEnabled'>,
  developmentKeys: ReadonlySet<string>,
): T[] {
  return modules.filter((module) => developmentKeys.has(module.key) || flags.isEnabled(module.key));
}
