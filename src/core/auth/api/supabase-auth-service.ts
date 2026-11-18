import type { AuthChangeEvent as SupabaseAuthEvent, Session } from '@supabase/supabase-js';
import { z } from 'zod';

import { logger } from '../../lib';
import { AUTH_STORAGE_KEY, getSupabaseClient } from '../../supabase';
import { classifyAuthError, reasonForInvalidCredentials } from '../auth-errors';
import type { EmailStatus, RawAuthError } from '../auth-errors';
import type {
  AuthChangeEvent,
  AuthFailureReason,
  AuthResult,
  AuthService,
  AuthUser,
} from '../auth-types';
import { storedSessionUser } from '../offline-session';
import { PROFILE_COLUMNS, parseProfile } from '../profile';
import type { SignupProfile } from '../signup';

// El AuthService real: el único sitio de la app que habla con Supabase Auth.

const emailStatusSchema = z.enum(['none', 'unconfirmed', 'confirmed']);

type EmailStatusResult =
  { ok: true; status: EmailStatus } | { ok: false; reason: AuthFailureReason };

function toUser(session: Session | null): AuthUser | null {
  if (session === null) {
    return null;
  }
  return { id: session.user.id, email: session.user.email ?? '' };
}

function toAppEvent(event: SupabaseAuthEvent): AuthChangeEvent {
  switch (event) {
    case 'INITIAL_SESSION':
      return 'initial';
    case 'SIGNED_IN':
      return 'signed-in';
    case 'SIGNED_OUT':
      return 'signed-out';
    default:
      return 'updated';
  }
}

function failure(error: RawAuthError, action: string): { ok: false; reason: AuthFailureReason } {
  const kind = classifyAuthError(error);
  const reason = kind === 'invalid_credentials' ? 'unknown' : kind;
  if (reason === 'unknown') {
    // Sin datos personales: solo el código técnico del error.
    logger.error(`Auth: ${action} failed`, { code: error.code, status: error.status });
  }
  return { ok: false, reason };
}

const OK: AuthResult = { ok: true };

function readStoredSession(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Los datos del registro, con los nombres que usan el trigger y las plantillas. */
function toUserMetadata(profile: SignupProfile) {
  return {
    display_name: profile.displayName.trim(),
    locale: profile.locale,
    weight_unit: profile.weightUnit,
    terms_version: profile.termsVersion,
  };
}

function resultOf(error: RawAuthError | null, action: string): AuthResult {
  return error === null ? OK : failure(error, action);
}

/** ¿Tiene cuenta este email? Lo usa la app para dar el mensaje correcto (D-043). */
export async function fetchEmailStatus(email: string): Promise<EmailStatusResult> {
  const { data, error } = await getSupabaseClient().rpc('email_status', { p_email: email });
  if (error !== null) {
    return failure(error, 'email status');
  }
  const parsed = emailStatusSchema.safeParse(data);
  if (!parsed.success) {
    logger.error('Auth: unexpected email status response');
    return { ok: false, reason: 'unknown' };
  }
  return { ok: true, status: parsed.data };
}

/**
 * Antes de mandar un código se comprueba que el email tiene cuenta: si no la
 * tiene, no se envía nada y la app lo dice (D-043).
 */
async function requireAccount(email: string): Promise<AuthResult> {
  const status = await fetchEmailStatus(email);
  if (!status.ok) {
    return status;
  }
  return status.status === 'none' ? { ok: false, reason: 'no_account' } : OK;
}

export function createSupabaseAuthService(): AuthService {
  const client = getSupabaseClient();

  return {
    onChange(listener) {
      // Supabase avisa siempre primero con INITIAL_SESSION: así se sabe si ya
      // había sesión guardada en el dispositivo.
      const { data } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION' && session === null) {
          // Sin conexión para renovar el token, la sesión sigue guardada: se
          // entra con ella (offline-session.ts, D-118).
          listener(storedSessionUser(readStoredSession()), 'initial');
          return;
        }
        listener(toUser(session), toAppEvent(event));
      });
      return () => data.subscription.unsubscribe();
    },

    async signInWithPassword(email, password): Promise<AuthResult> {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error === null) {
        return { ok: true };
      }
      if (classifyAuthError(error) !== 'invalid_credentials') {
        return failure(error, 'sign in');
      }
      // Supabase no distingue "no existe" de "contraseña mala": se pregunta aparte.
      const status = await fetchEmailStatus(email);
      return status.ok ? { ok: false, reason: reasonForInvalidCredentials(status.status) } : status;
    },

    async sendSignInCode(email) {
      const account = await requireAccount(email);
      if (!account.ok) {
        return account;
      }
      // shouldCreateUser: false. Con un código solo se entra; no se crean cuentas (D-039).
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      return resultOf(error, 'send sign-in code');
    },

    async verifySignInCode(email, code) {
      const { error } = await client.auth.verifyOtp({ email, token: code, type: 'email' });
      return resultOf(error, 'verify sign-in code');
    },

    async sendPasswordResetCode(email) {
      const account = await requireAccount(email);
      if (!account.ok) {
        return account;
      }
      const { error } = await client.auth.resetPasswordForEmail(email);
      return resultOf(error, 'send password reset code');
    },

    async verifyPasswordResetCode(email, code) {
      const { error } = await client.auth.verifyOtp({ email, token: code, type: 'recovery' });
      return resultOf(error, 'verify password reset code');
    },

    async updatePassword(newPassword, currentPassword) {
      const { error } = await client.auth.updateUser(
        currentPassword === undefined
          ? { password: newPassword }
          : { password: newPassword, current_password: currentPassword },
      );
      if (error !== null) {
        return failure(error, 'update password');
      }
      // D-042: con la contraseña nueva se cierran las sesiones de los demás
      // dispositivos. Si falla, la contraseña ya está cambiada: solo se registra.
      const { error: othersError } = await client.auth.signOut({ scope: 'others' });
      if (othersError !== null) {
        logger.warn('Auth: could not close the other sessions', {
          code: othersError.code,
          status: othersError.status,
        });
      }
      return OK;
    },

    async signUp(input) {
      const status = await fetchEmailStatus(input.email);
      if (!status.ok) {
        return status;
      }
      if (status.status === 'confirmed') {
        return { ok: false, reason: 'account_exists' };
      }
      if (status.status === 'unconfirmed') {
        return { ok: false, reason: 'email_not_confirmed' };
      }
      // Los datos de la cuenta (user_metadata) los lee el trigger que crea el
      // perfil, y las plantillas de email para elegir el idioma (D-044).
      const { error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: toUserMetadata(input) },
      });
      return resultOf(error, 'sign up');
    },

    async resendSignupCode(email) {
      const status = await fetchEmailStatus(email);
      if (!status.ok) {
        return status;
      }
      if (status.status === 'none') {
        return { ok: false, reason: 'no_account' };
      }
      if (status.status === 'confirmed') {
        return { ok: false, reason: 'account_exists' };
      }
      const { error } = await client.auth.resend({ type: 'signup', email });
      return resultOf(error, 'resend signup code');
    },

    async verifySignupCode(email, code) {
      const { error } = await client.auth.verifyOtp({ email, token: code, type: 'signup' });
      return resultOf(error, 'verify signup code');
    },

    async completeSignup({ password, profile }) {
      // Vale siempre la última contraseña escrita (D-043). Si es la misma que ya
      // tenía la cuenta (lo normal), Supabase responde "same_password": no pasa nada.
      if (password !== null) {
        const { error } = await client.auth.updateUser({ password });
        if (error !== null && classifyAuthError(error) !== 'same_password') {
          return failure(error, 'complete signup (password)');
        }
      }
      if (profile === null) {
        return OK;
      }
      const { data, error: userError } = await client.auth.updateUser({
        data: toUserMetadata(profile),
      });
      if (userError !== null) {
        return failure(userError, 'complete signup (metadata)');
      }
      const { error: profileError } = await client
        .from('profiles')
        .update({
          display_name: profile.displayName.trim(),
          locale: profile.locale,
          weight_unit: profile.weightUnit,
        })
        .eq('user_id', data.user.id);
      if (profileError !== null) {
        return failure(profileError, 'complete signup (profile)');
      }
      const { error: termsError } = await client.rpc('accept_terms', {
        p_version: profile.termsVersion,
      });
      return resultOf(termsError, 'complete signup (terms)');
    },

    async getProfile() {
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError !== null) {
        throw new Error(`Could not load the user: ${userError.code ?? 'unknown'}`);
      }
      const { data, error } = await client
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('user_id', userData.user.id)
        .single();
      if (error !== null) {
        throw new Error(`Could not load the profile: ${error.code}`);
      }
      return parseProfile(data);
    },

    async updateProfile(patch) {
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError !== null) {
        return failure(userError, 'update profile (user)');
      }
      const { error } = await client
        .from('profiles')
        .update({
          ...(patch.displayName === undefined ? {} : { display_name: patch.displayName.trim() }),
          ...(patch.locale === undefined ? {} : { locale: patch.locale }),
          ...(patch.weightUnit === undefined ? {} : { weight_unit: patch.weightUnit }),
          ...(patch.defaultRestSeconds === undefined
            ? {}
            : { default_rest_seconds: patch.defaultRestSeconds }),
          ...(patch.restAutostart === undefined ? {} : { rest_autostart: patch.restAutostart }),
          ...(patch.restSound === undefined ? {} : { rest_sound: patch.restSound }),
          ...(patch.restVibration === undefined ? {} : { rest_vibration: patch.restVibration }),
          ...(patch.sameButton === undefined ? {} : { same_button: patch.sameButton }),
        })
        .eq('user_id', userData.user.id);
      if (error !== null) {
        return failure(error, 'update profile');
      }
      // Los emails los manda Supabase Auth, que no lee `profiles`: el idioma y el
      // nombre van también en los datos de la cuenta (D-044).
      if (patch.locale !== undefined || patch.displayName !== undefined) {
        const { error: metadataError } = await client.auth.updateUser({
          data: {
            ...(patch.locale === undefined ? {} : { locale: patch.locale }),
            ...(patch.displayName === undefined ? {} : { display_name: patch.displayName.trim() }),
          },
        });
        if (metadataError !== null) {
          return failure(metadataError, 'update profile (metadata)');
        }
      }
      return OK;
    },

    async needsCurrentPassword() {
      // El método con el que se entró en esta sesión: 'password', 'otp',
      // 'recovery'… Solo con contraseña hace falta escribir la actual (D-042).
      const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error !== null) {
        return true;
      }
      // Cada entrada puede llegar como texto ('password') o como objeto con su hora.
      const latest = data.currentAuthenticationMethods
        .map((entry) => (typeof entry === 'string' ? { method: entry, timestamp: 0 } : entry))
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      return latest === undefined || latest.method === 'password';
    },

    async signOut() {
      // 'local': solo este dispositivo; las demás sesiones siguen abiertas.
      // Supabase borra la sesión del dispositivo ANTES de avisar al servidor, así
      // que cerrar sesión funciona aunque no haya conexión. Si el aviso al
      // servidor falla, la sesión ya está cerrada aquí: solo se registra.
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error !== null) {
        logger.warn('Auth: could not revoke the session on the server', {
          code: error.code,
          status: error.status,
        });
      }
    },
  };
}
