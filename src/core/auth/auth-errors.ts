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

const RATE_LIMIT_CODES = new Set([
  'over_request_rate_limit',
  'over_email_send_rate_limit',
  'over_sms_send_rate_limit',
]);

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
  if (error.code === 'invalid_credentials') {
    return 'invalid_credentials';
  }
  if (error.code === 'email_not_confirmed') {
    return 'email_not_confirmed';
  }
  if ((error.code !== undefined && RATE_LIMIT_CODES.has(error.code)) || error.status === 429) {
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
