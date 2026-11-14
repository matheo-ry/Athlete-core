import { createContext } from 'react';

/** 'loading' mientras se piden los flags del tenant; 'error' si no se pudieron pedir. */
export type FlagsStatus = 'loading' | 'ready' | 'error';

export interface FeatureFlags {
  /** `true` si la función está activa para el tenant actual. Una clave desconocida está apagada. */
  isEnabled: (featureKey: string) => boolean;
  status: FlagsStatus;
  /** Vuelve a pedir los flags (para el botón "Reintentar"). */
  retry: () => void;
}

export const FlagsContext = createContext<FeatureFlags | null>(null);
