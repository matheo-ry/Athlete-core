import { describe, expect, it } from 'vitest';

import { classifyAuthError, isNetworkError, reasonForInvalidCredentials } from './auth-errors';

describe('classifyAuthError', () => {
  it('reconoce la contraseña o el email equivocados', () => {
    expect(classifyAuthError({ code: 'invalid_credentials', status: 400 })).toBe(
      'invalid_credentials',
    );
  });

  it('reconoce una cuenta sin confirmar', () => {
    expect(classifyAuthError({ code: 'email_not_confirmed', status: 400 })).toBe(
      'email_not_confirmed',
    );
  });

  it('reconoce los topes de Supabase y los de la base de datos', () => {
    expect(classifyAuthError({ code: 'over_request_rate_limit', status: 429 })).toBe(
      'rate_limited',
    );
    expect(classifyAuthError({ status: 429 })).toBe('rate_limited');
    expect(classifyAuthError({ code: 'P0001', message: 'rate_limited' })).toBe('rate_limited');
  });

  it('reconoce que no hay conexión', () => {
    expect(classifyAuthError({ name: 'AuthRetryableFetchError', status: 0 })).toBe('offline');
    expect(classifyAuthError({ message: 'TypeError: Failed to fetch' })).toBe('offline');
  });

  it('reconoce los errores de los códigos por email y de la contraseña nueva', () => {
    expect(classifyAuthError({ code: 'otp_expired', status: 403 })).toBe('invalid_code');
    expect(classifyAuthError({ code: 'otp_disabled', status: 422 })).toBe('no_account');
    expect(classifyAuthError({ code: 'weak_password', status: 422 })).toBe('weak_password');
    expect(classifyAuthError({ code: 'same_password', status: 422 })).toBe('same_password');
    expect(classifyAuthError({ code: 'current_password_invalid', status: 400 })).toBe(
      'wrong_password',
    );
    expect(classifyAuthError({ code: 'over_email_send_rate_limit', status: 429 })).toBe(
      'rate_limited',
    );
  });

  it('cualquier otra cosa es un error inesperado', () => {
    expect(classifyAuthError({ code: 'unexpected_failure', status: 500 })).toBe('unknown');
    expect(classifyAuthError({})).toBe('unknown');
  });
});

describe('isNetworkError', () => {
  it('no confunde un error del servidor con la falta de conexión', () => {
    expect(isNetworkError({ status: 500, message: 'Database error' })).toBe(false);
  });
});

describe('reasonForInvalidCredentials', () => {
  it('sin cuenta, lo dice; con cuenta, es la contraseña (D-043)', () => {
    expect(reasonForInvalidCredentials('none')).toBe('no_account');
    expect(reasonForInvalidCredentials('confirmed')).toBe('wrong_password');
    expect(reasonForInvalidCredentials('unconfirmed')).toBe('wrong_password');
  });
});
