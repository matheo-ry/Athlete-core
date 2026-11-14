import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { logger } from '../lib';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';
import type { AuthService, AuthStatus, AuthUser, SignedOutReason } from './auth-types';
import {
  clearLastActiveAt,
  isInactiveTooLong,
  readLastActiveAt,
  writeLastActiveAt,
} from './inactivity';

interface AuthProviderProps {
  service: AuthService;
  children: ReactNode;
  /** Solo para tests: la hora "actual". */
  now?: () => number;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  signedOutReason: SignedOutReason;
}

/** Al perder la sesión: ¿la cerró el usuario, caducó, o nunca la hubo? */
function signedOutReasonAfter(previous: AuthState, explicit: boolean): SignedOutReason {
  if (explicit) {
    return 'explicit';
  }
  if (previous.status === 'signed-in' || previous.signedOutReason === 'expired') {
    return 'expired';
  }
  return null;
}

/**
 * La sesión del usuario (DECISIONES D-045 y D-061).
 * - Se mantiene al recargar y al cerrar la app: la guarda Supabase en el dispositivo.
 * - Si pasan 30 días sin abrir la app, se cierra al arrancar.
 * - Si la sesión se pierde sin que el usuario la cierre, se avisa de que ha caducado.
 */
export function AuthProvider({ service, children, now = Date.now }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    signedOutReason: null,
  });
  // Lo marca signOut(): así un cierre pedido por el usuario no se confunde con
  // una sesión caducada.
  const explicitSignOut = useRef(false);

  useEffect(() => {
    const unsubscribe = service.onChange((user, event) => {
      if (user === null) {
        const explicit = explicitSignOut.current;
        explicitSignOut.current = false;
        setState((previous) => ({
          status: 'signed-out',
          user: null,
          signedOutReason: signedOutReasonAfter(previous, explicit),
        }));
        return;
      }

      if (event === 'initial' && isInactiveTooLong(readLastActiveAt(), now())) {
        // 30 días sin abrir la app: hay que volver a entrar. Si no hay conexión
        // para avisar al servidor, la app igualmente trata la sesión como cerrada.
        clearLastActiveAt();
        setState({ status: 'signed-out', user: null, signedOutReason: 'expired' });
        service.signOut().catch(() => {
          logger.warn('Auth: could not close an inactive session on the server');
        });
        return;
      }

      writeLastActiveAt(now());
      setState({ status: 'signed-in', user, signedOutReason: null });
    });
    return unsubscribe;
  }, [service, now]);

  // Cada vez que se vuelve a la app cuenta como "abrirla".
  useEffect(() => {
    if (state.status !== 'signed-in') {
      return undefined;
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        writeLastActiveAt(now());
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [state.status, now]);

  const signOut = useCallback(async () => {
    explicitSignOut.current = true;
    try {
      await service.signOut();
      clearLastActiveAt();
    } catch (error) {
      explicitSignOut.current = false;
      throw error;
    }
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, service, signOut }),
    [state, service, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
