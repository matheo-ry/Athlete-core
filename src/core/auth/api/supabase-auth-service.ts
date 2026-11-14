import type { AuthChangeEvent as SupabaseAuthEvent, Session } from '@supabase/supabase-js';
import { z } from 'zod';

import { logger } from '../../lib';
import { getSupabaseClient } from '../../supabase';
import { classifyAuthError, reasonForInvalidCredentials } from '../auth-errors';
import type { EmailStatus, RawAuthError } from '../auth-errors';
import type {
  AuthChangeEvent,
  AuthFailureReason,
  AuthResult,
  AuthService,
  AuthUser,
} from '../auth-types';

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

export function createSupabaseAuthService(): AuthService {
  const client = getSupabaseClient();

  return {
    onChange(listener) {
      // Supabase avisa siempre primero con INITIAL_SESSION: así se sabe si ya
      // había sesión guardada en el dispositivo.
      const { data } = client.auth.onAuthStateChange((event, session) => {
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
