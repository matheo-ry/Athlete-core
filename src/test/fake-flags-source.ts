import type { FlagsSource } from '@/core/flags';

/**
 * Flags falsos para los tests: las claves activas de cada tenant, por id.
 * Por defecto ninguno, como en la base de datos hasta que llegue el primer
 * módulo del producto (el de ejemplo se monta sin flag en desarrollo).
 */
export function createFakeFlagsSource(
  enabledByTenant: Readonly<Record<string, string[]>> = {},
): FlagsSource {
  return {
    listEnabledFeatures(tenantId) {
      return Promise.resolve([...(enabledByTenant[tenantId] ?? [])].sort());
    },
  };
}
