import { z } from 'zod';

// Lo que se escribe en los formularios de cuenta es un dato de fuera: se valida
// con Zod antes de enviarlo (AGENTS.md §4). Cada error es una clave de texto.

export const PASSWORD_MIN_LENGTH = 8; // D-041
export const PASSWORD_MAX_LENGTH = 72; // D-041: el máximo que admite Supabase
export const CODE_LENGTH = 6; // D-038

const emailSchema = z.string().trim().min(1, 'required').pipe(z.email('invalid'));

export type EmailError = 'required' | 'invalid';

/** Devuelve el email limpio, o el motivo por el que no vale. */
export function checkEmail(
  value: string,
): { ok: true; email: string } | { ok: false; error: EmailError } {
  const result = emailSchema.safeParse(value);
  if (result.success) {
    return { ok: true, email: result.data.toLowerCase() };
  }
  return {
    ok: false,
    error: result.error.issues[0]?.message === 'required' ? 'required' : 'invalid',
  };
}

export type NewPasswordError = 'too_short' | 'too_long';

/** Reglas de una contraseña nueva (D-041): solo la longitud. */
export function checkNewPassword(value: string): NewPasswordError | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return 'too_short';
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return 'too_long';
  }
  return null;
}

/**
 * Deja solo las cifras de lo escrito o pegado: "123 456" o "123-456" valen igual.
 * Corta a 6, por si se pega el texto del email entero.
 */
export function normalizeCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

export function isCompleteCode(value: string): boolean {
  return normalizeCode(value).length === CODE_LENGTH;
}
