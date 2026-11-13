import { createContext } from 'react';

export interface FeatureFlags {
  /** `true` si la función está activa para el tenant actual. Una clave desconocida está apagada. */
  isEnabled: (featureKey: string) => boolean;
}

export const FlagsContext = createContext<FeatureFlags | null>(null);
