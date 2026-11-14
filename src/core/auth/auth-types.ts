import type { ProfilePatch, UserProfile } from './profile';
import type { SignupInput, SignupProfile } from './signup';

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
  | 'no_account'
  | 'account_exists'
  | 'wrong_password'
  | 'email_not_confirmed'
  | 'invalid_code'
  | 'weak_password'
  | 'same_password'
  | 'rate_limited'
  | 'offline'
  | 'unknown';

export type AuthResult = { ok: true } | { ok: false; reason: AuthFailureReason };

/** Qué ha cambiado en la sesión. Lo que manda Supabase, reducido a lo que usa la app. */
export type AuthChangeEvent = 'initial' | 'signed-in' | 'signed-out' | 'updated';

export type AuthChangeListener = (user: AuthUser | null, event: AuthChangeEvent) => void;

export interface AuthService {
  /** Avisa de cada cambio. La primera llamada ('initial') dice si ya había sesión. */
  onChange(listener: AuthChangeListener): () => void;
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  /** Envía un código de 6 dígitos para entrar sin contraseña. No crea cuentas (D-039). */
  sendSignInCode(email: string): Promise<AuthResult>;
  /** Entra con el código del email. */
  verifySignInCode(email: string, code: string): Promise<AuthResult>;
  /** Envía un código para cambiar la contraseña (D-042). */
  sendPasswordResetCode(email: string): Promise<AuthResult>;
  /** Comprueba el código de cambiar la contraseña. Si vale, el usuario queda dentro. */
  verifyPasswordResetCode(email: string, code: string): Promise<AuthResult>;
  /**
   * Cambia la contraseña del usuario que ha entrado y cierra sus sesiones en los
   * demás dispositivos (D-042). La actual solo hace falta si entró con contraseña.
   */
  updatePassword(newPassword: string, currentPassword?: string): Promise<AuthResult>;
  /**
   * Crea la cuenta y envía el código para confirmar el email (D-038 y D-040).
   * Si el email ya tiene cuenta: 'account_exists' (confirmada) o
   * 'email_not_confirmed' (pendiente), y no se crea nada (D-043).
   */
  signUp(input: SignupInput): Promise<AuthResult>;
  /** Vuelve a enviar el código de confirmar el email. */
  resendSignupCode(email: string): Promise<AuthResult>;
  /** Confirma el email con el código. Si vale, el usuario queda dentro. */
  verifySignupCode(email: string, code: string): Promise<AuthResult>;
  /**
   * Justo después de confirmar: guarda otra vez la contraseña recién escrita (vale
   * siempre la última, D-043) y los datos del formulario, y apunta la aceptación
   * de los términos. `null` en lo que no se sepa.
   */
  completeSignup(input: {
    password: string | null;
    profile: SignupProfile | null;
  }): Promise<AuthResult>;
  /** El perfil del usuario que ha entrado (D-058). */
  getProfile(): Promise<UserProfile>;
  /**
   * Cambia el perfil. El idioma y el nombre se guardan también en los datos de
   * la cuenta, que son los que leen los emails (D-044).
   */
  updateProfile(patch: ProfilePatch): Promise<AuthResult>;
  /**
   * ¿Hace falta la contraseña actual para cambiarla? No, si entró con un código
   * por email: ya demostró que el email es suyo (D-042).
   */
  needsCurrentPassword(): Promise<boolean>;
  /** Cierra la sesión en este dispositivo. Funciona también sin conexión. */
  signOut(): Promise<void>;
}

/** Estado de la sesión que ve la app. */
export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

/**
 * Por qué no hay sesión: la cerró el usuario, caducó (o pasaron 30 días sin
 * abrir la app, D-045) o no la hubo nunca.
 */
export type SignedOutReason = 'explicit' | 'expired' | null;
