import type { FeatureFlags, FlagsStatus } from './flags-context';

const noop = () => undefined;

/** Convierte una lista de claves activas en el objeto que usan `useFeature` y `FeatureGate`. */
export function flagsFor(
  keys: Iterable<string>,
  status: FlagsStatus = 'ready',
  retry: () => void = noop,
): FeatureFlags {
  const enabled = new Set(keys);
  return { isEnabled: (featureKey) => enabled.has(featureKey), status, retry };
}
