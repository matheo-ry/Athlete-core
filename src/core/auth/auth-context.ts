import { createContext } from 'react';

import type { AuthService, AuthStatus, AuthUser, SignedOutReason } from './auth-types';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Por qué no hay sesión. Sirve para avisar de una sesión caducada (D-061). */
  signedOutReason: SignedOutReason;
  service: AuthService;
  /** Cierra la sesión en este dispositivo. Lanza un error si no se pudo. */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
