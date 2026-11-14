import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { flagsFor } from './feature-flags';
import { FlagsContext } from './flags-context';

interface StaticFlagsProviderProps {
  children: ReactNode;
  enabledFeatures: ReadonlySet<string>;
}

/** Solo para tests de componentes sueltos: flags fijos, sin tenant ni base de datos. */
export function StaticFlagsProvider({ children, enabledFeatures }: StaticFlagsProviderProps) {
  const value = useMemo(() => flagsFor(enabledFeatures), [enabledFeatures]);
  return <FlagsContext value={value}>{children}</FlagsContext>;
}
