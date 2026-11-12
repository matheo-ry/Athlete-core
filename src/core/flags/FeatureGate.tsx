import type { ReactNode } from 'react';

import { useFeature } from './useFeature';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  /** Qué se muestra si la función está apagada. Por defecto, nada. */
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  return useFeature(feature) ? children : fallback;
}
