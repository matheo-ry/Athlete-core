import type { FlagsSource } from '@/core/flags';

/**
 * Los flags de los módulos del producto, como en la tabla `features`. Son de
 * tipo core: activos para todos los negocios (D-019).
 */
export const PRODUCT_FEATURES: readonly string[] = ['clients', 'exercises', 'programs', 'workouts'];

/**
 * Flags falsos para los tests. Por defecto, los del producto activos en todos
 * los negocios. `enabledByTenant` cambia los de un negocio concreto, por id.
 */
export function createFakeFlagsSource(
  enabledByTenant: Readonly<Record<string, readonly string[]>> = {},
): FlagsSource {
  return {
    listEnabledFeatures(tenantId) {
      return Promise.resolve([...(enabledByTenant[tenantId] ?? PRODUCT_FEATURES)].sort());
    },
  };
}
