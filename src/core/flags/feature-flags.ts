import type { FeatureFlags } from './flags-context';

/** Convierte una lista de claves activas en el objeto que usan `useFeature` y `FeatureGate`. */
export function flagsFor(keys: Iterable<string>): FeatureFlags {
  const enabled = new Set(keys);
  return { isEnabled: (featureKey) => enabled.has(featureKey) };
}
