import { use } from 'react';

import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

/** La sesión actual. Solo funciona dentro de `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
