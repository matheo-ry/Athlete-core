import type { AuthFailureReason } from './auth-types';

// Traduce los errores de Supabase Auth a los motivos que entiende la app.
// Es lógica pura, sin Supabase, para poder probarla con un test.

/** Lo mínimo que mira la app de un error de Supabase (o de la red). */
export interface RawAuthError {
  code?: string | undefined;
  status?: number | undefined;
  name?: string | undefined;
  message?: string | undefined;
}

/** 'invalid_credentials' necesita una segunda consulta: ¿el email tiene cuenta? (D-043) */
export type AuthErrorKind = AuthFailureReason | 'invalid_credentials';

// Códigos de error de Supabase Auth y el motivo que ve la app.
const CODE_KINDS: Readonly<Record<string, AuthErrorKind>> = {
  invalid_credentials: 'invalid_credentials',
  email_not_confirmed: 'email_not_confirmed',
  over_request_rate_limit: 'rate_limited',
  over_email_send_rate_limit: 'rate_limited',
  over_sms_send_rate_limit: 'rate_limited',
  // Supabase usa "otp_expired" tanto para un código caducado como para uno equivocado.
  otp_expired: 'invalid_code',
  // Pedir un código para entrar con un email sin cuenta (no se crean cuentas así, D-039).
  otp_disabled: 'no_account',
  user_not_found: 'no_account',
  weak_password: 'weak_password',
  user_already_exists: 'account_exists',
  email_exists: 'account_exists',
  same_password: 'same_password',
  current_password_required: 'wrong_password',
  current_password_invalid: 'wrong_password',
};

/** ¿El error es que no hay conexión? */
export function isNetworkError(error: RawAuthError): boolean {
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return true;
  }
  const message = error.message ?? '';
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}

export function classifyAuthError(error: RawAuthError): AuthErrorKind {
  if (isNetworkError(error)) {
    return 'offline';
  }
  const byCode = error.code === undefined ? undefined : CODE_KINDS[error.code];
  if (byCode !== undefined) {
    return byCode;
  }
  if (error.status === 429) {
    return 'rate_limited';
  }
  if (error.message === 'rate_limited') {
    // El tope de intentos de nuestras funciones de la base de datos (D-052).
    return 'rate_limited';
  }
  return 'unknown';
}

export type EmailStatus = 'none' | 'unconfirmed' | 'confirmed';

/**
 * Supabase responde lo mismo a "no existe" y a "contraseña mala". La app lo
 * distingue preguntando a `email_status` (D-043).
 */
export function reasonForInvalidCredentials(status: EmailStatus): AuthFailureReason {
  return status === 'none' ? 'no_account' : 'wrong_password';
}
