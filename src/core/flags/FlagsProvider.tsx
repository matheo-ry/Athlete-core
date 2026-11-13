import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { FlagsContext } from './flags-context';
import type { FeatureFlags } from './flags-context';
import { SAMPLE_ENABLED_FEATURES } from './sample-flags';

interface FlagsProviderProps {
  children: ReactNode;
  /** Solo para tests: sustituye los flags de ejemplo. */
  enabledFeatures?: ReadonlySet<string>;
}

/**
 * Qué funciones están activas para el tenant actual. Recuerda: los flags son
 * empaquetado de producto, NO seguridad (ARQUITECTURA §9).
 */
export function FlagsProvider({
  children,
  enabledFeatures = SAMPLE_ENABLED_FEATURES,
}: FlagsProviderProps) {
  const value = useMemo<FeatureFlags>(
    () => ({ isEnabled: (featureKey) => enabledFeatures.has(featureKey) }),
    [enabledFeatures],
  );

  return <FlagsContext value={value}>{children}</FlagsContext>;
}
