// Tipos de la sesión. La app no conoce a Supabase: habla con un `AuthService`.
// La implementación real vive en `api/` (la única carpeta que toca Supabase) y
// los tests usan una falsa (`src/test/fake-auth-service.ts`).

/** El usuario que ha entrado. Solo identificadores: nada de datos personales de más. */
export interface AuthUser {
  id: string;
  email: string;
}

/** Por qué no se ha podido hacer algo. Cada motivo tiene su mensaje (DECISIONES D-043 y D-061). */
export type AuthFailureReason =
  'no_account' | 'wrong_password' | 'email_not_confirmed' | 'rate_limited' | 'offline' | 'unknown';

export type AuthResult = { ok: true } | { ok: false; reason: AuthFailureReason };

/** Qué ha cambiado en la sesión. Lo que manda Supabase, reducido a lo que usa la app. */
export type AuthChangeEvent = 'initial' | 'signed-in' | 'signed-out' | 'updated';

export type AuthChangeListener = (user: AuthUser | null, event: AuthChangeEvent) => void;

export interface AuthService {
  /** Avisa de cada cambio. La primera llamada ('initial') dice si ya había sesión. */
  onChange(listener: AuthChangeListener): () => void;
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  /** Cierra la sesión en este dispositivo. */
  signOut(): Promise<void>;
}

/** Estado de la sesión que ve la app. */
export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

/**
 * Por qué no hay sesión: la cerró el usuario, caducó (o pasaron 30 días sin
 * abrir la app, D-045) o no la hubo nunca.
 */
export type SignedOutReason = 'explicit' | 'expired' | null;
