import type { AuthFailureReason } from './auth-types';

// La clave de texto de cada motivo de fallo. Las comparten todas las pantallas
// de cuenta (entrar, registrarse, recuperar la contraseña…).
const FAILURE_MESSAGE_KEYS: Record<AuthFailureReason, string> = {
  no_account: 'core.auth.errors.noAccount',
  account_exists: 'core.auth.errors.accountExists',
  wrong_password: 'core.auth.errors.wrongPassword',
  email_not_confirmed: 'core.auth.errors.notConfirmed',
  invalid_code: 'core.auth.errors.invalidCode',
  weak_password: 'core.auth.errors.passwordTooShort',
  same_password: 'core.auth.errors.samePassword',
  rate_limited: 'core.errors.rateLimited',
  offline: 'core.errors.offline',
  unknown: 'core.errors.unexpected',
};

export function failureMessageKey(reason: AuthFailureReason): string {
  return FAILURE_MESSAGE_KEYS[reason];
}
