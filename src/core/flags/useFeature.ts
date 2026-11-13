import { useFeatureFlags } from './useFeatureFlags';

/** `true` si la función `featureKey` está activa para el tenant actual. */
export function useFeature(featureKey: string): boolean {
  return useFeatureFlags().isEnabled(featureKey);
}
