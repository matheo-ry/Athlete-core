import { use } from 'react';

import { FlagsContext } from './flags-context';
import type { FeatureFlags } from './flags-context';

export function useFeatureFlags(): FeatureFlags {
  const value = use(FlagsContext);
  if (value === null) {
    throw new Error('useFeatureFlags must be used inside <FlagsProvider>');
  }
  return value;
}
